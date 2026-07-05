// One-off generator for PWA icon PNGs (no canvas dep available).
// Draws a rounded blue square with a white shield glyph, pure pixel math + zlib PNG encoding.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BLUE = [37, 99, 235]; // #2563EB — matches the app's login accent color
const WHITE = [255, 255, 255];

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function roundedRectMask(size, radius) {
  return (x, y) => {
    const rx = Math.min(radius, size / 2);
    if (x >= rx && x <= size - rx) return true;
    if (y >= rx && y <= size - rx) return true;
    const cx = x < rx ? rx : size - rx;
    const cy = y < rx ? rx : size - rx;
    return (x - cx) ** 2 + (y - cy) ** 2 <= rx * rx;
  };
}

function shieldPolygon(size, scale) {
  const cx = size / 2;
  const top = size * (0.5 - scale / 2);
  const w = size * scale;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const midY = top + w * 0.55;
  const bottomY = top + w * 1.05;
  return [
    [left, top],
    [right, top],
    [right, midY],
    [cx, bottomY],
    [left, midY],
  ];
}

function checkPolygonThick(size, scale) {
  // simple check-mark as a thick polyline, expressed as a polygon
  const cx = size / 2;
  const cy = size * 0.52;
  const s = size * scale;
  const t = size * 0.045; // thickness
  const p1 = [cx - s * 0.28, cy + s * 0.02];
  const p2 = [cx - s * 0.06, cy + s * 0.24];
  const p3 = [cx + s * 0.32, cy - s * 0.22];
  function seg(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * t, ny = (dx / len) * t;
    return [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny],
      [a[0] - nx, a[1] - ny],
    ];
  }
  return [seg(p1, p2), seg(p2, p3)];
}

function makeIcon(size, { padding = 0, maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const inner = size - padding * 2;
  const mask = roundedRectMask(size, maskable ? 0 : size * 0.18);
  const shield = shieldPolygon(size, maskable ? 0.5 : 0.62);
  const checks = checkPolygonThick(size, maskable ? 0.5 : 0.62);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let color = null;
      if (maskable) {
        color = BLUE; // full-bleed background required for maskable safe-zone
      } else if (mask(x, y)) {
        color = BLUE;
      }
      if (color) {
        const inShield = pointInPolygon(x, y, shield);
        const inCheck = checks.some((poly) => pointInPolygon(x, y, poly));
        if (inShield || inCheck) color = WHITE;
        buf[idx] = color[0];
        buf[idx + 1] = color[1];
        buf[idx + 2] = color[2];
        buf[idx + 3] = 255;
      } else {
        buf[idx + 3] = 0;
      }
    }
  }
  return buf;
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(size, rgbaBuf) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // no filter
    rgbaBuf.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function writeIcon(file, size, opts) {
  const buf = makeIcon(size, opts);
  fs.writeFileSync(file, encodePng(size, buf));
  console.log('wrote', file);
}

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });
writeIcon(path.join(outDir, 'icon-192.png'), 192, {});
writeIcon(path.join(outDir, 'icon-512.png'), 512, {});
writeIcon(path.join(outDir, 'maskable-512.png'), 512, { maskable: true });
writeIcon(path.join(outDir, 'apple-touch-icon.png'), 180, {});
