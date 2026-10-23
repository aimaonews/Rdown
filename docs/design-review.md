# Rdown 专业级 UI/UX 审查报告与视觉重构方案

审查日期：2026-10-20 · 审查方式：源码逐文件审查 + 浏览器实测计算样式（1280×720，亮/暗双主题）
遵循技能：frontend-design（已加载生效）· ui-ux-pro-max（已加载生效，Python CLI 已执行 `--design-system` 检索）

---

## 一、架构与组件审查

| 层 | 现状 | 评价 |
|---|---|---|
| 技术栈 | Vue 3 `<script setup>` + Vite + Element Plus（全量引入）+ Pinia + vue-i18n（10 语言 139 键） | 合理，无需变更 |
| 样式架构 | `styles.css`（设计令牌 --kd-*/--el-*）+ 各组件 scoped CSS | 骨架正确，但**亮色令牌未闭环**（见缺陷 D1） |
| 公共组件 | TaskRow / NewTaskDialog 两个业务组件；基础控件全部裸用 Element Plus | 无自有组件库沉淀，各页直接调 El 默认外观导致风格分裂 |
| 主题机制 | html.dark 切换 + el-config-provider 语言联动 | 机制健全 |
| 图标 | Element Icons（线性）+ 自绘 logo | 图标语义 OK，尺寸体系缺失 |

## 二、全状态盘点

| 界面 | 状态覆盖 | 缺口 |
|---|---|---|
| 任务页 | 空态（el-empty 默认）/ 下载中 / 暂停 / 完成 / 错误 | 空态无行动引导设计；无加载骨架；断连仅小圆点提示 |
| 新建任务弹窗 | URL 输入 / 解析结果（文件/种子/流三种）/ 高级选项折叠 | 弹窗 padding 过紧、标题层级弱、textarea 无边框 |
| 设置页 | 基本 / BT / 流媒体 / 应用 四组表单 | 组间无卡片/分隔线容器，一长串表单的"表单墙" |
| 导航/头部 | 侧导航 + 标题 + 连接圆点 | 导航激活态是 Element 默认灰（#f0f2f5）非品牌色 |
| 暗色 | 基本覆盖（body/输入/按钮实测正确） | 个别 Element 内部填充色未映射（fill-color 系列） |

### 浏览器扩展（补充审查，2026-10-20 渲染实测）

> 审查方式：popup.html / options.html 挂载本地服务器真实渲染取计算样式；确认弹窗（mode=confirm）因依赖 chrome.* API 仅做源码级审查。

| 界面 | 现状实测 | 评价 |
|---|---|---|
| popup | 296px 宽、品牌色已生效（按钮 #4F46E5、ghost #EEF2FF、capture 底 #F7F9FA）、开关 40×22、按钮 35px | **比 Web UI 健康**（早前品牌对齐轮已覆盖），但字体栈仅 `"Microsoft YaHei"` 无系统回退（E1） |
| options | 720px 居中、h1 20/700、h2 15px+细分隔线、输入 33px、主按钮 36px、hint 12px slate | 结构良好；同样字体栈问题；分组靠 h2 底线而非卡片（可接受） |
| 确认弹窗（v3.2） | 源码审查：文件名/split/服务器选择表单 | 需与主弹窗统一控件尺寸（E4） |
| 本页媒体列表 | maxHeight 220px 滚动 | OK |

**扩展缺陷补充**：
- E1 字体栈硬编码 `"Microsoft YaHei"`，无系统字体回退链（英文/macOS/无雅黑环境渲染降级）
- E2 popup 状态行 6px/0 padding 偏紧，统计数字无 tabular-nums
- E3 popup 无焦点可见态（focus-visible）样式
- E4 确认弹窗控件尺寸未与主弹窗三档（36/32/28）对齐
- E5 扩展暗色仅跟随系统（prefers-color-scheme），与 App 内主题设置不联动——**刻意保留**（扩展正确行为），仅记录

**扩展改造项（并入阶段二）**：
- E1/E2/E3 → popup.html / options.html 样式统一：字体栈换系统栈、统计数字 tabular-nums、补 `:focus-visible` 环
- E4 → 确认弹窗按钮/输入套用三档尺寸
- 不动 background.js / content.js / lib.js 的任何逻辑

## 三、缺陷定界（实测证据）

- **D1 亮色令牌未闭环（根因级）**：亮色下 `--el-text-color-primary=#303133`、`--el-text-color-secondary=#909399`、`--el-border-color-lighter=#ebeef5`、导航激活 `--el-fill-color-light=#f0f2f5` —— 全部是 Element Plus 出厂值，aimao slate 阶梯（#1e293b/#475569/#e5e7eb）只在暗色映射了。**当前亮色主题实质是"Element 默认皮"而非品牌设计。**
- **D2 控件尺寸过小**：任务行操作按钮实测 **24×24px**（ui-ux-pro-max 标准 ≥44pt 触达、桌面端建议 ≥28px）；主按钮 32px；设置输入 30px；弹窗"解析"按钮 24px 与页脚 32px 同屏不一致。
- **D3 排版层级弱**：页面标题 16px/600 与正文 14px 几乎无层级差；弹窗标题 18px/400 过弱；速度值无 tabular-nums（数字跳动时宽度抖）；设置组标题纯文本无容器。
- **D4 间距无网格**：任务行 padding 12/14、列表 gap 8、弹窗 padding 16（680px 宽弹窗过紧）、状态栏 margin 8 —— 非 4/8 节奏。
- **D5 圆角尺度混乱**：任务行 10 / 图标 9 / nav-item 10 / logo 12 / 弹窗 6 / 按钮 6(el) / tag 4 —— 6 种圆角无规则。
- **D6 边框阴影无体系**：任务行 1px #ebeef5 + hover 泛灰阴影（el-box-shadow-light）——典型"SaaS 卡片套件"感，与品牌扁平精致方向不符。
- **D7 空状态无设计**：el-empty 默认插画+一行字，未做"行动邀请"（frontend-design：空态是行动的入口）。
- **D8 弹窗输入框边框缺失**：textarea 实测 `border: 0px none`，白底弹窗上无输入区边界。
- **D9 数字与状态呈现**：速度/大小文本无 tabular-nums、无单位弱化处理；状态 tag 20px 与 14px 标题行高不齐。
- **D10 长文案语言适配**：德语/葡语下 24px 圆形按钮仅靠 tooltip 传达语义，无焦点可见态验证。

## 四、风格定位

**品牌一致的扁平精致风（Brand-Flat / Apple HIG 启发）**

理由：
1. **品牌约束优先**：用户已确立 aimao.today 视觉系统（靛蓝 #4f46e5 + slate 中性色 + 8px 圆角 + 扁平卡片）。ui-ux-pro-max 检索给出的 teal 通用方案（#0D9488）与既定品牌冲突，按其自身规则"数据集是建议而非指令"予以否决，仅采纳其结构纪律（对比度/触达尺寸/动效克制）。
2. **为什么是 Apple HIG 启发而不是 Apple 复刻**：桌面 Web + Element Plus 技术栈不适合毛玻璃与 SF 字体；借鉴的是其**控件尺度**（大点击目标、分组列表、克制的阴影）与**内容优先**的层级观，而非表面元素。
3. **frontend-design 纪律**：不做渐变装饰、不堆卡片、动效只回应用户操作；空态与错误态写成行动指引。

## 五、设计方案

### 5.1 设计令牌（在现有 --kd-* 骨架上补全闭环）

```
色彩（亮/暗双套，全部映射到 --el-*）：
  primary   #4F46E5 / #818CF8     品牌靛蓝（不变）
  text      #1E293B / #E8E8E8     primary
            #475569 / #B0B0B0     secondary
            #64748B / #888888     tertiary
            #94A3B8 / #666666     muted
  surface   #F7F9FA / #16161A     页面底
            #FFFFFF / #2A2A2A     卡片
            #F1F5F9 / #3A3A3A     悬停/填充
  border    #E5E7EB / #3A3A3A     主边框
            #F1F5F9 / #2A2A2A     次边框
  semantic  success #16A34A  warning #F59E0B  danger #EF4444（暗色提亮）

排版阶梯（系统字体栈不变，中文 PingFang/YaHei 优先）：
  T1 页面标题    20px / 600
  T2 弹窗标题    17px / 600
  T3 组标题      13px / 600 / +2%字距（小标题不大写，遵守 frontend-design 反 AI 套路）
  body           14px / 400
  meta           13px / 400（次级）
  caption        12px / 400（辅助）
  数字           tabular-nums 强制（速度/大小/计数）

间距网格（4pt）：4 8 12 16 20 24 32
  页面边距 24 / 卡片内边距 16 / 列表项间距 8 / 组间距 24 / 弹窗内边距 20

圆角尺度（4 档）：
  R-容器 10px（任务行/卡片/弹窗）
  R-控件 6px（按钮/输入/下拉）
  R-徽章 4px（tag/badge）
  R-图标 8px（类型图标/logo）

控件尺寸（3 档）：
  L 36px：页面主按钮（新建任务/保存设置/开始下载）
  M 32px：表单输入、次级按钮、弹窗按钮
  S 28px：任务行操作按钮（24→28，图标 16px）

边框与阴影：
  边框统一 1px var(--kd-border)；卡片默认无阴影
  悬停：border-color → var(--kd-primary) 40% 透明度 + 2px 微抬升阴影 rgba(15,23,42,.06)
  弹窗遮罩 rgba(15,23,42,.45)（slate 调而非纯黑）
  焦点环：2px var(--kd-focus) outline-offset 2px（键盘可见，遵守 ui-ux-pro-max）

动效：仅交互反馈 150-200ms ease；尊重 prefers-reduced-motion；无入场编排动画
```

### 5.2 组件沉淀顺序（样式层重构，零业务逻辑变更）

| 序 | 对象 | 动作 |
|---|---|---|
| 1 | styles.css | 补全亮色 --el-* 全映射（修 D1 根因）；写入上述令牌 |
| 2 | TaskRow | 操作钮 28px、行 padding 16、meta tabular-nums、tag 对齐、hover 微边框 |
| 3 | Tasks 状态栏+空态 | 速度值数字排版、主按钮 L 档、空态自绘引导（图标+一句行动文案+L 按钮） |
| 4 | NewTaskDialog | padding 20、标题 T2、textarea 恢复 1px 边框、解析按钮统一 M 档、变体列表卡片化 |
| 5 | Settings | 四组改为分组卡片（组标题+细分隔线）、输入统一 M 档、保存按钮 L 档 |
| 6 | App 导航/头部 | 激活态品牌浅底（--kd-primary-soft + primary 文字/左 3px 色条）、连接状态 pill 化 |
| 7 | 扩展 popup/options | 字体栈系统链、tabular-nums、focus-visible 环、确认弹窗控件对齐三档 |

### 5.3 回归风险评估与对策

| 风险 | 对策 |
|---|---|
| Element 类名覆写破坏组件内部结构 | 优先 CSS 变量（--el-*）驱动；必须覆写的用低特异性选择器，禁 `!important`（除个别 el 内联样式覆盖） |
| i18n key 结构 | 不触碰；仅调整布局与样式 |
| 业务逻辑/store/API | 冻结，零改动；仅样式与少量模板结构调整（结构调整逐项列出） |
| 暗色回归 | 每步构建后亮/暗双主题浏览器实测计算样式 |
| 功能回归 | 完成后跑：建任务→暂停→继续→删除全链路 + 扩展 112 项测试 |

---

**待确认**：以上方案确认后进入阶段二实施。如需调整风格方向（如更激进的差异化设计）或改造顺序，请指出。

---

## 阶段二/三 实施与验收记录（2026-10-20，方案已确认并全部落地）

### 实施清单（7 步全部完成）

| 序 | 对象 | 结果 |
|---|---|---|
| 1 | styles.css 令牌闭环 | 亮色 `--el-*` 全映射 slate 阶梯（D1 根因修复）；排版/间距/圆角/阴影/焦点环/减动效全套令牌 |
| 2 | TaskRow | 操作钮 24→**28px**、padding→16px、meta tabular-nums、hover 品牌微边框 |
| 3 | Tasks 状态栏+空态 | 速度值 14px/600/tabular-nums、主按钮 36px L 档、空态自绘引导（图标+标题+提示+CTA，新增 `tasks.emptyHint` 键 ×9 语言） |
| 4 | NewTaskDialog | padding 20px、标题 17px/600、textarea 边框恢复、解析钮 24→32px、开始下载 36px、变体列表卡片化 |
| 5 | Settings | 四组表单墙 → 分组卡片（组标题+分隔线+卡片容器）、保存钮 36px |
| 6 | App 导航/头部 | 激活态品牌浅底+左色条、标题 20px、连接状态 pill 化（在线绿/离线红）、头部 56px |
| 7 | 扩展 popup/options/确认弹窗 | 系统字体栈、tabular-nums、`:focus-visible` 环、确认弹窗控件对齐三档、媒体列表 hover |

### 验收实测（浏览器计算样式取证）

| 缺陷 | 前 | 后 | 结果 |
|---|---|---|---|
| D1 亮色文字 | #303133（Element 默认） | **#1e293b**（slate） | ✅ |
| D1 边框 | #ebeef5 | **#e5e7eb** | ✅ |
| D2 任务行操作钮 | 24×24px | **28×28px** | ✅ |
| D2 主按钮 | 32px | **36px** | ✅ |
| D3 页面标题 | 16px/600 | **20px/600** | ✅ |
| D3 弹窗标题 | 18px/400 | **17px/600** | ✅ |
| D4 弹窗 padding | 16px | **20px** | ✅ |
| D5 圆角 | 4/6/9/10/12 混乱 | **容器10/控件6/徽章4/图标8** | ✅ |
| D8 textarea 边框 | 0px none | **1px #e2e8f0** | ✅ |
| 暗色 | body #16161a / 文字 #e8e8e8 / 卡片 #2a2a2a / 主钮 #818cf8 / 导航激活 #312e81 | 全对 | ✅ |
| 空态 | el-empty 默认 | 自绘行动引导（含 9 语言提示文案） | ✅ |

### 功能回归（零退化）

- 下载全链路：create→pause→resume→delete ✓（含 34MB 真实文件）
- 流媒体任务：HLS 下载完成 ✓
- MCP 9 工具 ✓
- 扩展测试 112/112 ✓、i18n 校验（9 语言 108 键 0 缺失）✓
- Web 构建通过 ✓

### 已知局限（诚实声明）

1. 扩展确认弹窗依赖 `chrome.*` API，本环境无法真实渲染，仅源码级审查
2. 数据看板前端波形图未做（后端 `/api/v1/dashboard` 数据已就绪）——后续可补
3. 德语等长文案在 28px 圆形按钮上仅 tooltip 传达——已通过 focus-visible 环缓解键盘可达性
