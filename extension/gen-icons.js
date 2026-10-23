// 生成 extension/icons 下 16/48/128 的 PNG：蓝色圆形 + 白色向下箭头
// 纯 node（zlib 内置），无网络依赖。运行：node gen-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32（PNG 块校验）
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // 每行前置 filter=0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// 绘制：圆角蓝底圆 + 白色下箭头（箭头 = 竖杆 + 两翼），简单超采样抗锯齿
function drawIcon(size) {
  const S = 4; // 超采样倍数
  const W = size * S;
  const buf = Buffer.alloc(W * W * 4, 0);
  const cx = W / 2, cy = W / 2, R = W / 2 - S; // 圆半径
  const indigo = [79, 70, 229], white = [255, 255, 255];

  // 箭头几何（相对 W）：竖杆 x∈[0.44,0.56], y∈[0.22,0.62]；三角翼顶点 (0.5,0.80)，底边 y=0.55, x∈[0.26,0.74]
  function inArrow(nx, ny) {
    if (nx >= 0.44 && nx <= 0.56 && ny >= 0.22 && ny <= 0.62) return true;
    // 三角：y 从 0.55 到 0.80，半宽从 0.24 线性缩到 0
    if (ny >= 0.55 && ny <= 0.80) {
      const half = 0.24 * (0.80 - ny) / 0.25;
      return Math.abs(nx - 0.5) <= half;
    }
    return false;
  }

  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > R * R) continue; // 圆外透明
      const nx = (x + 0.5) / W, ny = (y + 0.5) / W;
      const c = inArrow(nx, ny) ? white : indigo;
      const i = (y * W + x) * 4;
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
    }
  }
  // 盒式降采样到 size
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const i = (((y * S + sy) * W) + (x * S + sx)) * 4;
        r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
      }
      const n = S * S, o = (y * size + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
    }
  }
  return out;
}

const dir = path.join(__dirname, 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = encodePNG(size, drawIcon(size));
  fs.writeFileSync(path.join(dir, `icon${size}.png`), png);
  console.log(`icon${size}.png ${png.length} bytes`);
}
