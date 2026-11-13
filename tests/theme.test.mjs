import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../js/ui/theme.js';

describe('theme', () => {
  describe('resolveTheme', () => {
    it('returns dark when preference is dark regardless of system setting', () => {
      assert.equal(resolveTheme('dark', false), 'dark');
      assert.equal(resolveTheme('dark', true), 'dark');
    });

    it('returns light when preference is light regardless of system setting', () => {
      assert.equal(resolveTheme('light', false), 'light');
      assert.equal(resolveTheme('light', true), 'light');
    });

    it('resolves system preference to dark when prefersDark is true', () => {
      assert.equal(resolveTheme('system', true), 'dark');
    });

    it('resolves system preference to light when prefersDark is false', () => {
      assert.equal(resolveTheme('system', false), 'light');
    });

    it('falls back to system resolution for unknown or missing preference values', () => {
      assert.equal(resolveTheme(null, true), 'dark');
      assert.equal(resolveTheme(null, false), 'light');
      assert.equal(resolveTheme(undefined, true), 'dark');
      assert.equal(resolveTheme(undefined, false), 'light');
      assert.equal(resolveTheme('auto', true), 'dark');
      assert.equal(resolveTheme('invalid', false), 'light');
    });
  });
});
