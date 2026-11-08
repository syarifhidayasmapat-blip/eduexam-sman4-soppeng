const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, getPixel) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Function to draw an educational crest for EduExam SMAN 4 Soppeng
function generateEduExamIcon(size) {
  const center = size / 2;
  const radius = size * 0.44;

  return createPNG(size, size, (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Background: Smooth rounded square or circle with subtle gradient
    // Squircle distance: (|dx/R|^4 + |dy/R|^4)
    const sqDist = Math.pow(Math.abs(dx) / (size * 0.46), 4) + Math.pow(Math.abs(dy) / (size * 0.46), 4);
    if (sqDist > 1.0) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }

    // Outer border (Gold #F59E0B)
    if (sqDist > 0.92) {
      return [245, 158, 11, 255];
    }

    // Main background: Navy blue gradient from #1E3A8A (top) to #0F172A (bottom)
    const t = y / size;
    let r = Math.round(30 * (1 - t) + 15 * t);
    let g = Math.round(58 * (1 - t) + 23 * t);
    let b = Math.round(138 * (1 - t) + 42 * t);

    // Inner decorative ring
    const ringDist = Math.abs(dist - size * 0.38);
    if (ringDist < size * 0.012) {
      return [13, 148, 136, 255]; // Teal ring
    }

    // Inner Shield Graphic (SMAN 4 Soppeng emblem)
    // Shield boundary:
    const sx = Math.abs(dx) / (size * 0.28);
    let sy = (dy + size * 0.05) / (size * 0.28);
    let inShield = false;

    if (sy >= -0.7 && sy <= 0.2 && sx <= 0.8) {
      inShield = true;
    } else if (sy > 0.2 && sy <= 1.0) {
      // Curve to bottom point
      const curveX = 0.8 * (1 - Math.pow((sy - 0.2) / 0.8, 1.8));
      if (sx <= curveX) inShield = true;
    }

    if (inShield) {
      // Shield border
      const isShieldBorder = (sx > 0.72) || (sy > 0.9) || (sy < -0.65);
      if (isShieldBorder) {
        return [245, 158, 11, 255]; // Gold border
      }
      // Shield interior: Teal gradient
      return [15, 118, 110, 255];
    }

    // Book motif in center of shield:
    const bx = Math.abs(dx) / (size * 0.16);
    const by = (dy + size * 0.03) / (size * 0.12);
    if (by >= -0.4 && by <= 0.5 && bx <= 0.9) {
      // Book pages (White)
      if (bx > 0.05 && bx < 0.85 && by > -0.3 && by < 0.4) {
        return [255, 255, 255, 255];
      }
      // Spine
      if (bx <= 0.05) {
        return [245, 158, 11, 255];
      }
    }

    // Graduation cap diamond above shield
    const capX = Math.abs(dx) / (size * 0.16);
    const capY = (dy + size * 0.22) / (size * 0.08);
    if (capX + Math.abs(capY) <= 0.9) {
      return [251, 191, 36, 255]; // Amber Gold
    }

    // Star on top
    const starDist = Math.sqrt(dx * dx + Math.pow(dy + size * 0.34, 2));
    if (starDist < size * 0.035) {
      return [245, 158, 11, 255];
    }

    return [r, g, b, 255];
  });
}

// Generate 192x192 and 512x512 icons
const icon192 = generateEduExamIcon(192);
const icon512 = generateEduExamIcon(512);

console.log('192x192 size:', icon192.length, 'bytes');
console.log('512x512 size:', icon512.length, 'bytes');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Save to both public/ and root directory
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(__dirname, '..', 'icon-192.png'), icon192);
fs.writeFileSync(path.join(__dirname, '..', 'icon-512.png'), icon512);

console.log('Icons written successfully to public/ and root!');

