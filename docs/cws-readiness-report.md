# Rdown 扩展 — Chrome Web Store 全要素合规审查总报告

审查日期：2026-10-24（复审，UI 视觉重构 + v0.0.1 版本定稿后重新制作素材） · 范围：extension/ 全部源码 + _locales 9 语言 + 商店后台物料 + 代码安全红线
结论：**全部就绪，可提交**。

---

## 1. ZIP 包与打包脚本

| 项 | 结果 |
|---|---|
| 打包脚本 | `tools/pack-extension.mjs`（纯 Node 手写 ZIP，STORE 方法），`npm run pack:extension` |
| 产物 | `extension-pack.zip`（27 个文件，895,708 B，version 0.0.1） |
| ZIP 根目录 | `manifest.json` 为首个条目 ✓ |
| 排除项 | gen-icons.js、store/、*.ts、*.map、node_modules、.git、.env 均未打入 ✓ |
| JSON 校验 | manifest.json 与 9 个 messages.json 全部合法，无注释、无尾随逗号 ✓ |

## 2. 多语言 i18n 全语种核查表

| locale | 键数 | 与 default_locale 对齐 | extName ≤45 | extDesc ≤132 | actionTitle ≤30 |
|---|---|---|---|---|---|
| en（default） | 115 | 基准 | 5 ✓ | 96 ✓ | 22 ✓ |
| zh_CN | 115 | ✓ | 5 | 47 ✓ | 10 ✓ |
| zh_TW | 115 | ✓ | 5 | 46 ✓ | 10 ✓ |
| de | 115 | ✓ | 5 | 109 ✓ | 22 ✓ |
| es | 115 | ✓ | 5 | 104 ✓ | 25 ✓ |
| fr | 115 | ✓ | 5 | 126 ✓ | 21 ✓ |
| ja | 115 | ✓ | 5 | 80 ✓ | 18 ✓ |
| ko | 115 | ✓ | 5 | 67 ✓ | 14 ✓ |
| pt_BR | 115 | ✓ | 5 | 103 ✓ | 30 ✓ |

- RTL 语言：无（ar/he/fa 未支持，无需 bidi 适配）
- 校验脚本：`test/i18n-check.mjs` 全部通过（含长度断言）

## 3. 图标与商店视觉素材实测

### 包内图标（PNG，RGBA，已实测像素）
| 文件 | 尺寸 | 格式 | 状态 |
|---|---|---|---|
| icons/icon16.png | 16×16 | PNG (ct=6 RGBA) | ✓ |
| icons/icon32.png | 32×32 | PNG (ct=6 RGBA) | ✓（本轮补齐） |
| icons/icon48.png | 48×48 | PNG (ct=6 RGBA) | ✓ |
| icons/icon128.png | 128×128 | PNG (ct=6 RGBA) | ✓ |

### 商店后台素材（全部 24 位 RGB 无 Alpha，已实测）

**分语言截图 9 套 × 4 张**（每张 1280×800, ct=2），界面语言与烧录标题均与该语言列表一致，存放于 `docs/store-assets/<localeCode>/shot-01..04.png`；源界面图在 `docs/store-assets/src-shots/<localeCode>/ui-*.png`。`en` 套同时作为全球通用兜底：

| 套 | shot-01 | shot-02 | shot-03 | shot-04 |
|---|---|---|---|---|
| en | Task list (light) | Stream dialog | Settings | Task list (dark) |
| de / es / fr / ja / ko / pt_BR / zh_CN / zh_TW | 同上四画面，UI 与标题已本地化 | | | |

各语言标题译文见各语言 `docs/store-listing/<locale>.md` 的 SCREENSHOTS CAPTIONS 注释块。

全球共用物料（英文文案，无需本地化）：
| 文件 | 尺寸 | 用途 |
|---|---|---|
| docs/store-assets/promo-tile-440x280.png | 440×280 (ct=2) | 小型宣传图（全球共用） |
| docs/store-assets/marquee-1400x560.png | 1400×560 (ct=2) | 大型横幅图（选填，Featured 提名用） |

截图均为"品牌画布底板 + 居中界面卡片 + 顶部卖点标题"包装合成，非原始浏览器截屏；合成页模板 `docs/store-assets/src-shots/compose-screenshot.html` 可复现。

## 4. 商店文案

| 语言 | 文件 | 摘要字符 | 正文格式 |
|---|---|---|---|
| zh_CN / zh_TW / en / de / es / fr / ja / ko / pt_BR | docs/store-listing/<locale>.md | 68–129（均 ≤132 ✓） | 纯文本 Emoji 五段式，零 Markdown 符号 ✓ |

校验：正文无 `#` 无 `**` 无 `- ` 列表符，无自夸词，无竞品名称，关键词 ≤5 次（validate.js 全部通过）。

## 5. 代码安全与政策红线扫描

| 红线（代号） | 结果 |
|---|---|
| 远程托管代码（Blue Argon） | 无：无远程 JS 加载、无 eval/new Function、第三方库（hls.js）本地打包 |
| 代码混淆（Red Titanium） | 无混淆，全部明文源码 |
| 过度申请权限（Purple Potassium） | 9 项权限全部在用（`tabs` 实测：域名过滤页面识别 + 嗅探标签跟踪；`sidePanel`：面板形态切换） |
| 单一用途（Red Magnesium） | 唯一用途：把用户发起的下载转发到本机 Rdown 管理器 |
| 功能报错/空壳（Yellow Magnesium） | 后端未启动时优雅降级：接管失败自动回退浏览器下载并提示 |
| 不安全传输（Purple Copper） | 默认仅 127.0.0.1 回环（合规豁免）；远程服务器配置在选项中提示使用 HTTPS + API Token |
| 违禁内容（Blue Zinc） | 不绕过付费墙、不下载受 DRM 保护内容（DRM 仅经用户自备的外部引擎处理，扩展本体不含） |

## 6. manifest 关键字段

- manifest_version: 3 ✓，version: 0.0.1 ✓，default_locale: en ✓
- name/short_name/description/actionTitle 全部 `__MSG_*__` ✓
- homepage_url: https://github.com/aimaonews/Rdown ✓（本轮补齐）
- minimum_chrome_version: 116（Service Worker WebSocket 需求）✓
- icons: 16/32/48/128 四件套 ✓（icon32 本轮补齐）

## 7. 隐私与申报

- PRIVACY.md：extension/PRIVACY.md（公开托管于 GitHub，URL 可用于后台隐私政策字段）+ 仓库根目录同步一份
- docs/cws-dashboard-fill-in.md：后台四页全字段复制粘贴单（Package/Store Listing/Privacy practices/Distribution & Account）
- 数据收集申报：如实申报 2 类（认证信息=Cookie、网站内容=下载请求头），仅用于完成用户发起的下载、仅发往本机服务；其余 7 类留空；Limited Use 三项全勾
- 远程代码：No

## 8. 待人工完成事项（扩展包与文档已备齐，需开发者本人在后台操作）

1. Chrome Web Store 开发者账号注册（$5，国内双币卡账单地区可选中国香港）
2. Account：Publisher name 填写 + 联系邮箱验证 + EEA Non-trader 声明
3. 上传 `extension-pack.zip`
4. Store Listing：按 docs/store-listing/ 9 语言填写 + 上传 4 张截图 + promo-tile + marquee + 图标
5. Privacy practices：按 cws-dashboard-fill-in.md 逐项勾选粘贴 + 测试说明
6. Distribution：Public + 国家/地区 + 审核邮件通知
