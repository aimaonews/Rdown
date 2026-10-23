// 商店素材后处理：promo 裁剪为 440×280；4 张截图 RGBA→RGB（合成到白底，商店要求无 Alpha）
import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePNG(buf) {
  if (!buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('not png');
  let off = 8, w = 0, h = 0, bitDepth = 8, colorType = 6;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12);
      bitDepth = buf[off + 16]; colorType = buf[off + 17];
    } else if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : 3;
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let recon;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = v + a; break;
        case 2: recon = v + b; break;
        case 3: recon = v + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          recon = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error('bad filter ' + filter);
      }
      out[y * stride + x] = recon & 0xff;
    }
  }
  return { w, h, ch, colorType, data: out };
}

const crcT = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(t, d) { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'ascii'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b; }
function encodePNG(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // color type 2: RGB 无 Alpha
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- 1. promo: 440x320 -> 440x280（裁顶 40px）----
{
  const src = decodePNG(fs.readFileSync('docs/store-assets/promo-440x320.png'));
  const W = 440, H = 280, cropY = 40;
  const rgb = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    const sy = y + cropY;
    for (let x = 0; x < W; x++) {
      const si = (sy * src.w + x) * src.ch;
      const o = (y * W + x) * 3;
      if (src.ch === 4) { rgb[o] = src.data[si]; rgb[o + 1] = src.data[si + 1]; rgb[o + 2] = src.data[si + 2]; }
      else { rgb[o] = src.data[si]; rgb[o + 1] = src.data[si + 1]; rgb[o + 2] = src.data[si + 2]; }
    }
  }
  fs.writeFileSync('docs/store-assets/promo-tile-440x280.png', encodePNG(W, H, rgb));
  console.log('promo-tile-440x280.png ✓ (440x280, RGB)');
}

// ---- 2. 4 张截图 RGBA -> RGB（白底合成）----
for (const f of ['shot-01', 'shot-02', 'shot-03', 'shot-04']) {
  const src = decodePNG(fs.readFileSync(`docs/store-assets/${f}.png`));
  const W = src.w, H = src.h;
  const rgb = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const si = i * src.ch, o = i * 3;
    const a = src.ch === 4 ? src.data[si + 3] / 255 : 1;
    rgb[o] = Math.round(src.data[si] * a + 255 * (1 - a));
    rgb[o + 1] = Math.round(src.data[si + 1] * a + 255 * (1 - a));
    rgb[o + 2] = Math.round(src.data[si + 2] * a + 255 * (1 - a));
  }
  fs.writeFileSync(`docs/store-assets/${f}.png`, encodePNG(W, H, rgb));
  console.log(`${f}.png ✓ (${W}x${H}, RGBA->RGB)`);
}

// ---- 3. 校验全部素材 ----
console.log('\n=== 商店素材终验 ===');
for (const f of fs.readdirSync('docs/store-assets')) {
  if (!f.endsWith('.png')) continue;
  const b = fs.readFileSync('docs/store-assets/' + f);
  console.log(f.padEnd(28), b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), 'colorType=' + b[25]);
}
