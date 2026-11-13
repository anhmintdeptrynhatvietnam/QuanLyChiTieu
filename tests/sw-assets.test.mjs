import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getFilesRecursively(relativeDir) {
  const fullPath = path.join(rootDir, relativeDir);
  if (!fs.existsSync(fullPath)) return [];
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const rel = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(rel));
    } else if (entry.isFile()) {
      results.push('./' + rel.replace(/\\/g, '/'));
    }
  }
  return results;
}

describe('Service Worker Precache Assets', () => {
  const swPath = path.join(rootDir, 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  // Extract CACHE_NAME
  const cacheNameMatch = swContent.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  const cacheName = cacheNameMatch ? cacheNameMatch[1] : '';

  // Extract ASSETS_TO_CACHE entries
  const assetsBlockMatch = swContent.match(/ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
  const assetEntries = [];
  if (assetsBlockMatch) {
    const stringMatches = assetsBlockMatch[1].matchAll(/['"]([^'"]+)['"]/g);
    for (const match of stringMatches) {
      assetEntries.push(match[1]);
    }
  }

  it('CACHE_NAME matches expected pattern', () => {
    assert.match(cacheName, /^qlct-pwa-v\d+\.\d+$/, `CACHE_NAME "${cacheName}" must match /^qlct-pwa-v\\d+\\.\\d+$/`);
  });

  it('ASSETS_TO_CACHE includes root shell and manifest', () => {
    const assetSet = new Set(assetEntries);
    assert.ok(assetSet.has('./'), "ASSETS_TO_CACHE must include './'");
    assert.ok(assetSet.has('./index.html'), "ASSETS_TO_CACHE must include './index.html'");
    assert.ok(assetSet.has('./manifest.json'), "ASSETS_TO_CACHE must include './manifest.json'");
  });

  it('every real file under js/, css/, and assets/icons/ is listed in ASSETS_TO_CACHE', () => {
    const realFiles = [
      ...getFilesRecursively('js'),
      ...getFilesRecursively('css'),
      ...getFilesRecursively('assets/icons')
    ];
    const assetSet = new Set(assetEntries);
    const missing = realFiles.filter((file) => !assetSet.has(file));
    assert.strictEqual(
      missing.length,
      0,
      `The following real files are missing from ASSETS_TO_CACHE: ${missing.join(', ')}`
    );
  });

  it('every listed ./js/..., ./css/..., and ./assets/... entry exists on disk', () => {
    for (const entry of assetEntries) {
      if (
        entry.startsWith('./js/') ||
        entry.startsWith('./css/') ||
        entry.startsWith('./assets/')
      ) {
        const fullPath = path.join(rootDir, entry.replace(/^\.\//, ''));
        assert.ok(
          fs.existsSync(fullPath),
          `Asset in ASSETS_TO_CACHE does not exist on disk: ${entry}`
        );
      }
    }
  });
});
