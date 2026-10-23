// Rdown Connector - 手动语言切换覆盖层
// Chrome 原生 chrome.i18n 只能跟随浏览器语言、无法运行时切换；
// 本文件从 chrome.storage.sync 读取 { locale }（'auto' = 跟随系统），
// 非 auto 时 fetch 对应 _locales/<目录>/messages.json 作为 OVERRIDE，
// i18n() 优先取 OVERRIDE，其次 chrome.i18n.getMessage，最后回退 key 本身。
// 普通脚本：background.js 用 importScripts 加载，popup/options 用 <script> 加载，
// 两个全局函数挂到 globalThis，各上下文共用。
(function () {
  'use strict';
  // 选项值 → _locales 目录名（pt-BR→pt_BR、zh-CN→zh_CN、zh-TW→zh_TW，其余同名）
  const LOCALE_DIRS = {
    en: 'en', de: 'de', es: 'es', fr: 'fr', 'pt-BR': 'pt_BR',
    ja: 'ja', 'zh-CN': 'zh_CN', 'zh-TW': 'zh_TW', ko: 'ko'
  };
  let OVERRIDE = null; // Chrome messages.json 格式：{ key: { message: '...' } } | null

  // 从 chrome.storage.sync 读取语言设置并（必要时）载入覆盖消息表
  async function loadI18nOverride() {
    OVERRIDE = null;
    try {
      const s = await chrome.storage.sync.get({ locale: 'auto' });
      const dir = LOCALE_DIRS[s && s.locale];
      if (!dir) return; // auto 或未知值：跟随浏览器语言
      const res = await fetch(chrome.runtime.getURL('_locales/' + dir + '/messages.json'));
      if (!res || !res.ok) return;
      const data = await res.json();
      if (data && typeof data === 'object') OVERRIDE = data;
    } catch (e) {
      OVERRIDE = null;
    }
  }

  // i18n(key, ...subs)：subs 兼容两种用法——展开参数 i18n('k', 'a', 'b')
  // 或单个数组 i18n('k', ['a', 'b'])（与 chrome.i18n.getMessage 一致）；$1..$N 占位替换
  function i18n(key, ...subs) {
    const flat = subs.length === 1 && Array.isArray(subs[0]) ? subs[0] : subs;
    try {
      const entry = OVERRIDE && OVERRIDE[key];
      if (entry && typeof entry.message === 'string') {
        let msg = entry.message;
        for (let i = 0; i < flat.length; i++) {
          msg = msg.split('$' + (i + 1)).join(String(flat[i]));
        }
        return msg;
      }
    } catch (e) {}
    try {
      const sub = subs.length === 0 ? undefined : (subs.length === 1 ? subs[0] : flat);
      const msg = chrome.i18n.getMessage(key, sub);
      if (msg) return msg;
    } catch (e) {}
    return key;
  }

  globalThis.i18n = i18n;
  globalThis.loadI18nOverride = loadI18nOverride;
})();
