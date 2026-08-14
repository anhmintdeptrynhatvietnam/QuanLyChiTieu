const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rowSize = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const offset = y * rowSize + 1 + x * bytesPerPixel;
      rawData[offset] = r;
      rawData[offset + 1] = g;
      rawData[offset + 2] = b;
      rawData[offset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Icon Drawer: Rounded rectangle with gradient blue and golden coin/wallet icon
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Corner radius: 22% of dimension
  const r = 0.22;
  let inBounds = true;

  if (nx < r && ny < r) {
    inBounds = (Math.hypot(nx - r, ny - r) <= r);
  } else if (nx > 1 - r && ny < r) {
    inBounds = (Math.hypot(nx - (1 - r), ny - r) <= r);
  } else if (nx < r && ny > 1 - r) {
    inBounds = (Math.hypot(nx - r, ny - (1 - r)) <= r);
  } else if (nx > 1 - r && ny > 1 - r) {
    inBounds = (Math.hypot(nx - (1 - r), ny - (1 - r)) <= r);
  }

  if (!inBounds) return [0, 0, 0, 0]; // Transparent

  // Gradient background: Royal Blue #2563eb to Deep Blue #1e40af
  const t = (nx + ny) / 2;
  let bgR = Math.round(37 * (1 - t) + 30 * t);
  let bgG = Math.round(99 * (1 - t) + 64 * t);
  let bgB = Math.round(235 * (1 - t) + 175 * t);

  // Center Wallet / Coin Icon
  const cx = nx - 0.5;
  const cy = ny - 0.5;

  // Outer circle of gold coin / wallet shield
  const dist = Math.hypot(cx, cy);
  if (dist < 0.26) {
    // Golden Coin: #f59e0b to #fbbf24
    if (dist > 0.23) {
      return [254, 240, 138, 255]; // Border #fef08a
    }
    // Inside coin: VND symbol or Star
    if (Math.abs(cx) < 0.08 && Math.abs(cy) < 0.14) {
      // White symbol
      return [255, 255, 255, 255];
    }
    return [245, 158, 11, 255]; // #f59e0b
  }

  // Subtle highlight shine at top
  if (ny < 0.3) {
    bgR = Math.min(255, bgR + Math.round((0.3 - ny) * 70));
    bgG = Math.min(255, bgG + Math.round((0.3 - ny) * 70));
    bgB = Math.min(255, bgB + Math.round((0.3 - ny) * 70));
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.join(__dirname, '..', 'assets', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, drawIcon));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, drawIcon));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, drawIcon));

console.log('App icons generated successfully in assets/icons/');
