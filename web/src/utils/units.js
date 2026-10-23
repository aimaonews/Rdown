// 单位双向换算：设置表单 UI 显示层 <-> 后端存储格式。
// 铁律：存储格式不变（字节/秒 number、毫秒 number、'NM'/'0' 字符串、逗号分隔 tracker），
// 所有换算只发生在表单的 Load / Save 层。纯函数，无 Vue 依赖，可被 node 测试直接导入。

export const BYTES_PER_KB = 1024
export const BYTES_PER_MB = 1048576

// ---- 限速：存储 number(字节/秒) <-> UI 数字（'MB' = MB/s，'KB' = KB/s） ----
export function bytesToSpeedDisplay(bytes, unit = 'MB') {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return 0
  if (unit === 'KB') return Math.round(n / BYTES_PER_KB)
  // MB/s 保留最多 2 位小数，避免 102400 -> 0.09765625 这类长尾
  return Math.round((n / BYTES_PER_MB) * 100) / 100
}

export function speedDisplayToBytes(value, unit = 'MB') {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * (unit === 'KB' ? BYTES_PER_KB : BYTES_PER_MB))
}

// ---- 流媒体超时：存储 ms <-> UI 秒 ----
export function msToSeconds(ms) {
  const n = Number(ms)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n / 1000)
}

export function secondsToMs(seconds) {
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * 1000)
}

// ---- 容量字符串：存储 '64M' / '0' <-> UI MB 数值 ----
export function sizeStrToMB(str) {
  if (str === null || str === undefined) return 0
  const s = String(str).trim()
  if (!s || s === '0') return 0
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([KkMmGg])$/)
  if (m) {
    const v = Number(m[1])
    const u = m[2].toUpperCase()
    if (u === 'G') return v * 1024
    if (u === 'M') return v
    return Math.round((v / 1024) * 100) / 100 // K -> MB
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function mbToSizeStr(mb) {
  const n = Number(mb)
  if (!Number.isFinite(n) || n <= 0) return '0'
  return `${Math.round(n)}M`
}

// ---- Tracker 列表：存储逗号分隔 <-> UI 每行一个 ----
export function trackersToText(str) {
  if (!str) return ''
  return String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
}

// 兼容换行与逗号两种分隔，去空、去重后逗号拼接
export function textToTrackers(text) {
  if (!text) return ''
  const parts = String(text)
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(parts)].join(',')
}

// ---- 端口：1~65535 整数校验 ----
export function isValidPort(p) {
  const n = Number(p)
  return Number.isInteger(n) && n >= 1 && n <= 65535
}

export function clampPort(p, fallback = 0) {
  const n = Math.round(Number(p))
  if (!Number.isFinite(n)) return fallback
  return Math.min(65535, Math.max(1, n))
}
