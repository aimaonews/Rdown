// Web 端 i18n 校验：web/src/i18n/locales 下 9 个语言文件的 key 集合（拍平为 a.b.c）
// 与 zh-CN 完全一致（0 缺失 0 多余），且值均为非空字符串。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const LOCALES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web', 'src', 'i18n', 'locales')
const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.js')).sort()

function flatten(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') out.push(...flatten(v, key))
    else out.push(key)
  }
  return out.sort()
}

const msgs = {}
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(LOCALES_DIR, f)).href)
  msgs[f.replace(/\.js$/, '')] = mod.default
}

const refName = 'zh-CN'
const refKeys = flatten(msgs[refName])
let fail = 0

console.log(`参照 ${refName}: ${refKeys.length} 个 key；发现语言: ${files.join(', ')}`)
if (files.length !== 9) {
  console.error(`✗ 语言文件数 = ${files.length}，应为 9`)
  fail++
}

for (const [name, obj] of Object.entries(msgs)) {
  const keys = flatten(obj)
  const missing = refKeys.filter((k) => !keys.includes(k))
  const extra = keys.filter((k) => !refKeys.includes(k))
  // 空值检查
  const empty = []
  const walk = (o, p = '') => {
    for (const [k, v] of Object.entries(o)) {
      const key = p ? `${p}.${k}` : k
      if (v && typeof v === 'object') walk(v, key)
      else if (typeof v !== 'string' || !v.trim()) empty.push(key)
    }
  }
  walk(obj)
  if (missing.length || extra.length || empty.length) {
    fail++
    console.error(`✗ ${name}: 缺失 ${missing.length} [${missing}] 多余 ${extra.length} [${extra}] 空值 ${empty.length} [${empty}]`)
  } else {
    console.log(`✓ ${name}: ${keys.length} keys，0 缺失 0 多余`)
  }
}

console.log(fail ? `\n结果: ${fail} 项失败` : '\n结果: 全部通过')
process.exit(fail ? 1 : 0)
