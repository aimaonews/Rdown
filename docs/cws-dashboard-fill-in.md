# Rdown — Chrome Developer Dashboard 全字段复制粘贴单

> 用途：在 Chrome Web Store 开发者后台逐项复制粘贴。字段名保留英文，粘贴文案为英文，说明为中文。
> 依据：`extension/manifest.json`（v0.0.1，MV3）、`extension/PRIVACY.md`（2026-10-19 版）、`extension/store/listing.md`、`README.md`。
> 仓库地址统一使用：https://github.com/aimaonews/Rdown

---

## 1. Package（ZIP 包）

- **版本号**：`0.0.1`（首次上传；与 `extension/manifest.json` 的 `"version": "0.0.1"` 一致，后续更新必须递增）
- **打包要求**：`manifest.json` 必须位于 ZIP 根目录（不要把 `extension/` 文件夹本身打包进去）

### 上传前核查项清单

- [ ] `manifest.json` 位于 ZIP 根目录；`background.js`、`options.html`、`popup.html`、`lib.js`、`content.js`、`icons/`、`_locales/`（9 个语言目录）全部存在
- [ ] 权限与 manifest 一致，无未使用权限（downloads / contextMenus / storage / notifications / alarms / webRequest / cookies / tabs / sidePanel + host_permissions `<all_urls>`）
- [ ] 无代码混淆、无远程可执行代码、无内联脚本（hls.js 等均为本地打包文件）
- [ ] `default_locale` 为 `en`，`_locales` 下 9 个目录的 `messages.json` 均可解析
- [ ] 图标 16/32/48/128 四尺寸齐备（`extension/icons/`）
- [ ] ZIP 内不含 `.git`、`node_modules`、`*.log` 等多余文件

---

## 2. Store Listing

### Item Title

```
Rdown
```

### Item Summary (English)（≤132 字符）

```
Capture browser downloads to the local Rdown manager: multi-connection HTTP, BT/magnet, m3u8/mpd, resume. Needs the Rdown local app.
```

- 实测字符数：**132 / 132**（含空格与标点，已达上限，不要再加词）

### Detailed Description

使用 **`docs/store-listing/en.md`** 的正文内容（由另一任务生成）：从 "Value Proposition (Summary)" 起的全部英文正文粘贴到 Detailed Description 框；其中 "Localized Graphic Assets Checklist" 一节是内部清单，**不要粘贴**。文末的 Privacy Note 段落需要一并粘贴。

### Primary Category

```
Productivity → Tools
```

（下载管理类；如后台只有一级选项则选 **Productivity**）

### Official URL

建议绑定 `https://github.com/aimaonews/Rdown`。
前提：需先在 Google Search Console 验证该 URL 的所有权；**如未验证，本字段留空**（不要填未验证的地址，否则无法保存）。

### Homepage URL

```
https://github.com/aimaonews/Rdown
```

### Support URL

```
https://github.com/aimaonews/Rdown/issues
```

### Mature content（成人内容分级）

```
No mature content
```

### Store icon（图标）

复用 `extension/icons/icon128.png`（128×128，程序生成的原创箭头图标，无需重制）。

### Screenshots（截图，分语言上传）

**9 种语言各一套，每套 4 张 1280×800 PNG**（24 位 RGB），界面与烧录标题均为该语言。在后台每个语言的列表页分别上传对应目录里的 4 张：

| 后台语言 tab | 上传 `docs/store-assets/` 下 | 
|---|---|
| English（默认/全球兜底） | `en/shot-01..04.png` |
| Deutsch | `de/shot-01..04.png` |
| Español | `es/shot-01..04.png` |
| Français | `fr/shot-01..04.png` |
| 日本語 | `ja/shot-01..04.png` |
| 한국어 | `ko/shot-01..04.png` |
| Português (Brasil) | `pt_BR/shot-01..04.png` |
| 简体中文 | `zh_CN/shot-01..04.png` |
| 繁體中文 | `zh_TW/shot-01..04.png` |

每套 4 张内容相同、语言不同：

1. 任务列表（亮色）
2. 新建任务对话框 —— 流媒体解析与清晰度选择
3. 设置页
4. 任务列表（暗色模式）

各语言标题文案见 `docs/store-listing/<locale>.md` 的 "SCREENSHOTS CAPTIONS" 注释块。

### Small Promo Tile（小宣传图）

`docs/store-assets/promo-tile-440x280.png`（440×280）

### Marquee Promo Tile（大宣传图）

`docs/store-assets/marquee-1400x560.png`（1400×560）

### Language（多语言条目）

按 `_locales/` 的 9 种语言逐个添加条目；每种语言的正文使用 `docs/store-listing/<localeCode>.md` 的内容，三个链接字段统一填上面的 Official/Homepage/Support URL：

| 后台语言 | localeCode | 描述文件 |
|---|---|---|
| English | en | `docs/store-listing/en.md` |
| Deutsch | de | `docs/store-listing/de.md` |
| Español | es | `docs/store-listing/es.md` |
| Français | fr | `docs/store-listing/fr.md` |
| 日本語 | ja | `docs/store-listing/ja.md` |
| 한국어 | ko | `docs/store-listing/ko.md` |
| Português (Brasil) | pt_BR | `docs/store-listing/pt_BR.md` |
| 简体中文 | zh_CN | `docs/store-listing/zh_CN.md` |
| 繁體中文 | zh_TW | `docs/store-listing/zh_TW.md` |

---

## 3. Privacy practices

### Single purpose description（单一用途说明，直接粘贴）

```
Rdown has a single purpose: to forward downloads initiated by the user in the browser to the Rdown download manager running on the user's own machine, so the download is completed by Rdown instead of the browser.
```

### Permission justification（逐项申请理由，直接粘贴）

| 权限 | Justification（英文，粘贴用） |
|---|---|
| **downloads** | `Used to intercept and manage browser downloads initiated by the user and forward them to the local Rdown download manager.` |
| **webRequest** | `Used to observe request headers (Cookie, Referer, User-Agent, Origin, Authorization) of downloads the user initiates, so the local Rdown manager can complete them. Observe-only; requests are never modified.` |
| **cookies** | `Used to read cookies of the download URL's site (including partitioned cookies) as a fallback so authenticated downloads work.` |
| **contextMenus** | `Used to add right-click menu items so users can send links, images, videos, audio, or all links on a page to Rdown.` |
| **notifications** | `Used to notify users when a download is sent to Rdown, completes, or fails.` |
| **alarms** | `Used to periodically refresh the badge (active task count) in the Manifest V3 service worker without keeping a persistent process.` |
| **storage** | `Used to save extension settings (server address, capture rules, language, onboarding state) via chrome.storage.` |
| **tabs** | `Used to identify the page hostname for domain-based capture filtering, and to track/clear sniffed media entries when tabs close or navigate.` |
| **sidePanel** | `Used to optionally display the Rdown manager panel in Chrome's Side Panel when the user chooses that panel style.` |
| **host_permissions `<all_urls>`** | `Required to observe download requests and read download-site cookies on any website, since downloads can originate from any site.` |

### Remote code（远程代码）

选择：**No, I am not using remote code**

说明：扩展不下载、不执行任何远程代码，所有逻辑（含本地打包的 hls.js 播放库）都包含在扩展包内。

### Data usage（数据使用声明）

按实际行为只勾选以下 2 项，其余 7 类全部留空不勾：

- ✅ **Authentication information（认证信息）**：仅在用户发起下载时，将下载请求所需的 Cookie 发送至用户本机的 Rdown 服务（默认 `127.0.0.1`）以完成该下载。
- ✅ **Website content（网站内容）**：仅在用户发起下载时，读取该下载请求的 HTTP 请求头并转发至用户本机的 Rdown 服务以完成该下载。
- ⬜ Personally identifiable information（个人身份信息）— 不勾
- ⬜ Financial and payment information（财务与付款信息）— 不勾
- ⬜ Health information（健康信息）— 不勾
- ⬜ Location（位置信息）— 不勾
- ⬜ Web history（浏览历史）— 不勾
- ⬜ User activity（用户活动）— 不勾
- ⬜ Personal communications（通信内容）— 不勾

**Limited Use 三项认证：全部打勾**

- ✅ 不出售用户数据（We do not sell user data）
- ✅ 不将数据用于与本扩展单一用途无关的目的（含广告/营销）
- ✅ 不将数据用于信用评估或借贷目的

### Privacy Policy URL

```
https://github.com/aimaonews/Rdown/blob/main/extension/PRIVACY.md
```

（提交前在无痕窗口打开确认可公开访问；内容为中英双语全文，见 `extension/PRIVACY.md`）

### Reviewer Test Instructions（审核员测试说明，直接粘贴）

```
This extension is the companion connector of the open-source local download manager "Rdown".
It requires the Rdown local service (Node.js 20+, open-source) running at http://127.0.0.1:16801.

How to test:
1. Download the Rdown package from the project repository (see the listing's Homepage URL) and run start.bat (requires Node.js 20+ on the machine); the local service starts at http://127.0.0.1:16801.
2. Install the extension, open its options page and click "Test connection" — it should report a successful connection.
3. On any website, click a file download link: the download is taken over and appears in the Rdown manager UI at http://127.0.0.1:16801; the browser download is cancelled.
4. Stop the local service and download the same file again: the extension detects the failure and automatically falls back to the normal browser download.
5. Right-click any link → "Download with Rdown" to test manual sending.
6. On a page containing a magnet: link, click the link to create a BitTorrent task directly.
7. Press Alt+Shift+D to toggle capture off/on; the toolbar badge shows "OFF" when capture is disabled.

The extension communicates ONLY with the user-configured server (default 127.0.0.1, loopback).
No user data is sent to any third party. No remote code is loaded or executed.
```

---

## 4. Distribution & Account

- **EEA Trader status（欧盟经济区交易者身份）**：选 **Non-trader**（非交易者）。本项目为个人免费开源项目、无盈利行为；选 Non-trader 可避免按欧盟 DSA 要求公开家庭住址与电话。
- **Publisher name（发布者名称）**：
  ```
  aimao
  ```
- **联系邮箱**：填写你自己的常用邮箱，并**完成邮箱验证**（后台会发验证邮件，点击邮件中的链接；未验证无法提交）。
- **Visibility（可见性）**：选 **Public**（公开发布）。
- **审核邮件通知**：建议开启（审核状态变更时邮件提醒）。
- **新账号限额说明**：全新开发者账号首个扩展有发布限额/更严审核；**首个扩展审核通过后限额自动解除**，属正常现象，无需额外操作。

---

## 5. 审核周期预期

- 本扩展含 `host_permissions: <all_urls>`，会触发**深度审核**：预计 **1–4 个工作日**。
- 提交时间建议避开欧美周末（周五晚至周日提交的审核通常顺延）。
- 常规更新（权限无变化）：通常**数小时至 1 个工作日**。
- 若被拒：按拒绝邮件中的政策条目逐条核对本单第 3 节的声明是否与实际行为一致，修正后重新提交即可，版本号无需递增（除非重新打包）。
