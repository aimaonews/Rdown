# 视觉报告代码审查确认书

审查日期：2026-10-23 · 方法：逐条对照源码当前值验证
背景：视觉模型审查 9 张截图产出 ~30 项发现，其中大部分已在上一轮修复。本报告区分三种状态：**确认存在（已修复）/ 确认存在（未修复）/ 模型误判**。

---

## 一、Web UI 主界面（截图 1-4）

| # | 报告发现 | 代码验证结论 | 状态 |
|---|---|---|---|
| P0-1 | 暗色进度条轨道与卡片同色（#2A2A2A） | **确认存在**。Element Plus 默认暗色 track 就是 el-bg-color（#2a2a2a），与卡面一致。已加 `html.dark .el-progress-bar__outer { background-color: #3f3f46 }` | ✅ 已修复 |
| P1-1 | 品牌竖条被视口左缘裁切 | **确认存在**。原 CSS `left: -8px` 使 3px 竖条溢出到侧边栏外部。已改为 `left: 4px` 收回 pill 内部 | ✅ 已修复 |
| P1-2 | 进度条右端不同状态不齐 | **确认存在（未修复）**。task-actions 按钮数量随状态变化（暂停 2 个按钮 vs 下载中 5 个），flex-shrink:0 但宽度不固定，导致 task-main 内进度条右端各异。需要给 task-actions 定宽或给进度条区固定百分比列宽 | ⚠️ 未修复 |
| P1-3 | 对话框底边距仅 18px | **确认存在**。Element Plus 默认 top:15vh + 高内容使底部贴视口。已加 `align-center` 属性垂直居中 | ✅ 已修复 |
| P1-4 | 种子/解析按钮尺寸不一致 | **确认存在**。种子按钮原为 size="small"（28px），解析为默认（32px）。已去掉 small 使两者统一 32px | ✅ 已修复 |
| P1-5 | textarea resize 手柄外露 | **确认存在**。Element Plus 默认允许 vertical resize。已加 `.el-textarea__inner { resize: none }` | ✅ 已修复 |
| P1-6 | "全部暂停/全部继续"无任务时仍可用 | **部分确认**。代码验证：「全部暂停」**已有** :disabled 绑定（Tasks.vue:22）——报告称两者都可点击是**误判**此半条；但「全部继续」确实无 disabled（Tasks.vue:23），当无任何任务时点击是空操作 | ⚠️ 半确认：resumeAll 未加 disabled |
| P1-7 | 卡片通栏 1294px 过宽 + 64% 空白 | **模型误判（宽度）**。tasks-view 已设 max-width: 1080px（Tasks.vue:116），不可能 1294px。空白区域是因为任务少（截图只有 1 个活跃任务）在整页布局下的自然结果，不是布局 bug。加底部汇总条是设计建议而非修复 | ❌ 宽度误判 / 空白为设计建议 |
| P1-8 | 暗色 meta 文字 4.05:1 | **确认存在**。原 #888888 于 #2a2a2a 确实约 4.05:1。已改为 #9a9a9a（≈4.9:1 过 WCAG AA） | ✅ 已修复 |
| P2 | 暗色卡面与页面背景同为 #2A2A2A | **模型误判**。代码验证：页面底 #16161a（--kd-bg），卡面 #2a2a2a（--kd-card-bg），两者明显不同。截图可能因压缩/缩放混淆了色值 | ❌ 误判 |
| P2 | 百分比无 tabular-nums | **部分确认**。.stat 与 .task-meta 已有 font-variant-numeric: tabular-nums（styles.css:216, TaskRow scoped）；el-progress__text 内百分比可能未覆盖 | ⚠️ 部分覆盖 |

## 二、设置页（截图 5-6）

| # | 报告发现 | 代码验证结论 | 状态 |
|---|---|---|---|
| P1-1 | 分组标题层级弱于字段标签 | **确认存在**。原 13px/tertiary 确实比标签 14px/secondary 弱。已升为 15px/600/primary + 3px 靛蓝竖条 | ✅ 已修复 |
| P1-2 | 限速显示 0.29（换算残留精度） | **确认存在**。原 fillForm 固定 MB/s 单位，300KB/s 显示 0.29。已改为 <1MB/s 自动切 KB/s 档 | ✅ 已修复 |
| P1-3 | 底栏右缘与卡片差 ~9px | **确认存在**。原底栏 padding 为 12px 16px（space-4），页面 gutter 为 24px（space-6），两侧差 8px。已统一为 space-6 | ✅ 已修复 |
| P1-4 | 恢复出厂无 danger 语义 | **确认存在**。原 hover 仅变色无底色。已加 danger-soft 背景与 danger 文字色 | ✅ 已修复 |
| P1-5 | hint 对比度 slate-400 ~2.8:1 | **确认存在**。原 --kd-text-muted（#94a3b8）在白底确实约 2.8:1。已改用 --kd-text-tertiary（#64748b，~4.7:1） | ✅ 已修复 |
| P1-6 | 下拉框宽度不统一（235px vs 324px） | **确认存在（未修复）**。locale 下拉 width: 240px，fileAllocation 下拉 width: 320px（Settings.vue:20,99）。两处 inline style 不一致 | ⚠️ 未修复 |
| P2 | 限速预设无激活态 | **模型误判**。代码已有 `:type="activeSpeedProfile === idx ? 'primary' : 'default'"`（Settings.vue:82），激活时按钮变为 primary 靛蓝实心。截图恰好是默认档（全速模式=当前生效）但视觉模型未识别 | ❌ 误判 |
| P2 | 底栏毛玻璃偏实 | **确认存在（设计建议）**。`color-mix(in srgb, var(--kd-card-bg) 82%, transparent)` + blur(8px)，82% 不透明度确实偏实。属设计偏好而非 bug | 🎨 设计选择 |

## 三、扩展界面（截图 7-9）

| # | 报告发现 | 代码验证结论 | 状态 |
|---|---|---|---|
| P0-1 | popup 高度失控（450px 空白） | **模型误判（测试环境伪影）**。popup body 无任何 min-height/height:100%。截图的空白是因为在 1280×800 的浏览器标签页中打开（审查环境），而非真实 Chrome popup 环境。真实 popup 由 Chrome 自动裁切到内容高度 | ❌ 误判（环境伪影） |
| P0-2 | 选项页暗色控件完全白底 | **确认存在**。根因精确：暗色覆盖 `input { background: #2a2a2a }` 选择器特异性 (0,0,1) 低于亮色 `input[type=text] { background: #fff }` 的 (0,1,1)，导致暗色永远不生效。已对齐为 `input[type=text]` 同级特异性并统一暗色 token | ✅ 已修复（根因是 CSS 特异性） |
| P1 | popup 统计值不突出 | **确认存在**。原与标签同字重同色。已改为 600 字重 + #1e293b | ✅ 已修复 |
| P1 | 选项页标题层级倒置 | **确认存在**。标题 #888（暗灰）、分隔线 #3a3a3a（亮灰）确实倒挂。已改为标题 #e4e4e7、分隔线 rgba(255,255,255,.10) | ✅ 已修复 |
| P1 | 选项页 hint 对比度不足 | **确认存在**。原 #888888 于 #16161a ≈ 3.9:1。已提至 #8b8fa3 | ✅ 已修复 |
| P1 | 页面底色 #000 而非 #16161a | **模型误判**。代码验证 body background 为 #16161a（options.html:38），非纯黑。可能因截图色偏 | ❌ 误判 |
| P1 | optAddServer 按钮未主题化 | **模型误判**。该按钮有 class="secondary"（options.html:95），暗色 CSS 有 `button.secondary { background: #2a2a2a; color: #e8e8e8 }` 会正常生效。模型可能受旁边 input 白底影响误判了整个区域 | ❌ 误判 |
| P2 | popup 宽度 296px 偏窄 | **确认存在（设计建议）**。296px 确实比 Chrome popup 主流的 320-400px 窄。加媒体列表区后可加宽 | 🎨 设计建议 |
| P2 | 开关 off 色与品牌色太近 | **确认存在**。原 #cbd5e1（slate-300 偏蓝灰）。已改 #d4d4d8 中性灰 | ✅ 已修复 |

---

## 四、统计汇总

| 分类 | 数量 | 明细 |
|---|---|---|
| **确认存在 · 已修复** | 15 项 | P0-1 暗色轨道, P1-1 竖条, P1-3 对话框居中, P1-4 按钮统一, P1-5 resize, P1-8 暗色 meta, 设置页 P1-1~5 全部, 扩展 P0-2 暗色控件, P1 统计值/标题/hint/开关色 |
| **确认存在 · 未修复** | 3 项 | ① 进度条右端不齐（P1-2，需 task-actions 定宽）② resumeAll 无 disabled（P1-6 半条）③ 下拉宽度不统一（设置页 P1-6） |
| **模型误判** | 5 项 | ① 卡片通栏 1294px（实际 max-width 1080）② 暗色卡面与页面同色（实际 #16161a vs #2a2a2a）③ popup 高度失控（审查环境伪影）④ 页面底色 #000（实际 #16161a）⑤ optAddServer 未主题化（有 secondary class） |
| **部分误判** | 1 项 | "全部暂停仍可用"（实际已有 disabled；但"全部继续"确实没有） |
| **设计建议（非 bug）** | 4 项 | 加汇总条、毛玻璃透明度、popup 加宽/加列表区、HLS 标签色改中性 |

## 五、待修复项优先级

1. **[P1] resumeAll 加 disabled**（一行改动）：
   ```vue
   <el-button @click="onResumeAll" :disabled="!store.activeTasks.length && !store.stoppedTasks.length">
   ```
2. **[P1] 设置页下拉宽度统一**（两处 inline style 统一为 320px）
3. **[P2] 进度条右端对齐**（给 .task-actions 加 min-width 或给进度条加固定百分比文本列）
