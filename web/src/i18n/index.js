import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import de from './locales/de.js'
import es from './locales/es.js'
import fr from './locales/fr.js'
import ptBR from './locales/pt-BR.js'
import ja from './locales/ja.js'
import zhCN from './locales/zh-CN.js'
import zhTW from './locales/zh-TW.js'
import ko from './locales/ko.js'

export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'pt-BR', 'ja', 'zh-CN', 'zh-TW', 'ko']

export function resolveLocale(preference) {
  if (preference && preference !== 'auto') {
    return SUPPORTED_LOCALES.includes(preference) ? preference : 'en'
  }
  const nav = String((typeof navigator !== 'undefined' && navigator.language) || 'en')
  const lower = nav.toLowerCase()
  const exact = SUPPORTED_LOCALES.find((s) => s.toLowerCase() === lower)
  if (exact) return exact
  const prefix = lower.split('-')[0]
  if (prefix === 'zh') {
    return /tw|hk|mo|hant/.test(lower) ? 'zh-TW' : 'zh-CN'
  }
  if (prefix === 'pt') return 'pt-BR'
  const byPrefix = SUPPORTED_LOCALES.find((s) => s.toLowerCase().split('-')[0] === prefix)
  return byPrefix || 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: resolveLocale('auto'),
  fallbackLocale: 'en',
  messages: {
    en,
    de,
    es,
    fr,
    'pt-BR': ptBR,
    ja,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    ko
  }
})

export default i18n
