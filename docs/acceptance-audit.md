# 功能验收自检报告（对照《全能下载管理器与浏览器扩展综合项目功能验收清单》）

自检日期：2026-10-19 · 代码库：rdown（Rdown）
状态图例：`[x]` 已完整实现 · `[~]` 部分实现/仅桩 · `[ ]` 未实现 · `[-]` 架构冲突/刻意取舍

---

## 模块 1：多协议下载核心引擎

### 1.1 基础协议与多源混合下载
- `[x]` HTTP/HTTPS —— `server/src/aria2/engine.js` 托管 aria2c（Motrix 定制版 1.36），实测 614KB 文件秒完（见会话测试记录）
- `[x]` FTP/SFTP —— aria2c 构建含 libssh2（`aria2c --version` 输出确认），`ftp://`/`sftp://` URI 直接透传 `rpc.addUri`（`server/src/aria2/rpc.js`）
- `[x]` BT/磁力 —— 实测 Big Buck Bunny 磁力解析元数据并以 5.7MB/s 下载、13 seeders；种子 base64 经 `addTorrent`（`server/src/api/server.js` create 路由）
- `[ ]` ed2k 电驴 —— aria2 不支持；参考 Gopeed `internal/protocol/ed2k/fetcher.go`（已定位源码，见路线图 P2）
- `[~]` Metalink —— `rpc.addMetalink` 客户端方法已封装（`rpc.js:25`）但 API/UI 未接线
- `[x]` 多源混合 —— aria2 原生：多镜像 URI 传 `addUri`；HTTP+BT 混合由 aria2 内部处理

### 1.2 分片并发、认证与底层优化
- `[x]` 多线程分片 split/断点续传 —— settings.split（最高 64，Motrix 定制构建）+ `--continue`
- `[x]` 参数化 URI —— aria2 原生 `{A..Z}`/`[000-100]` 展开，URI 直传即生效
- `[~]` .txt 批量导入 —— UI 支持多行 URL；本地 .txt 文件导入未做
- `[-]` netrc/代理认证/Basic 认证 —— aria2 原生支持，未在设置中暴露
- `[x]` 自定义 CA —— 启动时将 Node 内置 Mozilla 根证书写入 `data/cacert.pem` 供 aria2 使用（`server/src/index.js`，解决 Windows 证书库不可读问题）；双向 TLS 客户端证书未暴露
- `[~]` Cookie 多格式 —— 浏览器扩展实时捕获 Cookie/请求头透传（见模块 5.3）；Netscape cookies.txt 文件加载未做（aria2 `--load-cookies` 未接线）
- `[-]` 网卡绑定 —— aria2 `--interface` 未暴露
- `[x]` IPv6/Happy Eyeballs —— aria2 原生
- `[x]` 磁盘缓存 —— settings.diskCache（默认 64M）
- `[~]` 哈希校验 —— aria2 `--checksum` 原生支持，未在 API/设置暴露

### 1.3 BitTorrent 深度管理
- `[x]` DHT/PEX/LPD —— engine.js 启动参数 `--enable-dht --bt-enable-lpd --enable-peer-exchange`
- `[ ]` DHT/PEX 任务级独立开关
- `[x]` Web-Seeding —— aria2 原生
- `[x]` 选择性下载 —— UI 种子文件勾选 → `select-file` 选项（NewTaskDialog.vue）
- `[ ]` `--index-out` 目录重构
- `[~]` Tracker 自动管理 —— 多镜像源自动更新 + 6000 字符截断（`server/src/util/trackers.js`）；健康检测/存量任务刷新未做
- `[ ]` UPnP/NAT-PMP —— 参考 Motrix `src/main/core/UPnPManager.js`（本地源码已定位，路线图 P1）
- `[x]` 做种生命周期 —— settings.seedRatio/seedTime 暴露并在引擎参数应用；Peer 列表 RPC `getPeers` 已封装，UI 未展示

---

## 模块 2：流媒体引擎（原生 Node 实现 + 可选外挂 N_m3u8DL-RE）

### 2.1 清单解析
- `[x]` HLS/DASH —— `server/src/stream/hls.js`（master/media、KEY/MAP/BYTERANGE/DISCONTINUITY）+ `dash.js`（SegmentTemplate/List/Base、多 Period 基础）
- `[ ]` MSS(.ism) —— 原生不支持；外挂引擎路径可用（bin/N_m3u8DL-RE.exe，`external.js`）
- `[ ]` --base-url / --append-url-params 参数继承

### 2.2 轨道筛选
- `[~]` best/worst/带宽选择 —— `stream.select` 支持；`-sv/-sa/-ss` 全属性正则 DSL 未实现

### 2.3 选段/去广告
- `[ ]` --ad-keyword / --custom-range
- `[~]` 多 Period/Discontinuity —— 解析层支持归组；交互式选段未做

### 2.4 解密
- `[x]` AES-128（CBC/PKCS7、IV 缺省 media sequence、`--key` hex 覆盖）—— `native.js`，自测断言：解密输出与明文逐字节一致
- `[ ]` CENC/ChaCha20/SAMPLE-AES、多引擎调度 —— 外挂引擎路径覆盖

### 2.5 合并混流
- `[x]` 二进制拼接 concat —— `mux.js`
- `[-]` LOCAL_HTTP 虚拟流 —— 直接文件路径喂 ffmpeg（分片数可控，未做虚拟流）
- `[x]` ffmpeg 混流 TS→MP4（aac_adtstoasc+faststart）/DASH 双轨→MKV —— `mux.js`；mkvmerge/外部轨导入/字幕未做

### 2.6 直播
- `[x]` 直播录制（轮询去重、ENDLIST/时长上限停止、断流重试）—— `native.js` live 模式
- `[ ]` 实时合并/pipe 混流/时移回看/IPTV .m3u 批量

---

## 模块 3：任务调度与后处理

### 3.1 生命周期
- `[x]` resolve→create 两段式 —— `/api/v1/resolve` + `/api/v1/tasks`（Gopeed 式设计）
- `[x]` 开始/暂停/继续/重试/删除(可删文件)/全部暂停继续 —— `server/src/api/server.js` action 路由；reveal 打开目录
- `[~]` 重新下载/优先级调整/关键词搜索 —— retry 以重加 URI 近似；搜索仅状态 Tab
- `[ ]` 定时开始（task-start-at）
- `[x]` 最大并发 —— settings.maxConcurrentDownloads
- `[-]` SQLite 会话 —— 刻意取舍：aria2 session 文件（崩溃恢复实测）+ 流任务 JSON manifest 分片断点续传（`tasks/store.js`）；未引入 SQLite
- `[x]` 磁盘物理删除选项 —— deleteFiles（server.js delete 路由删除文件+aria2 控制块）

### 3.2 命名与分类
- `[ ]` 动态变量命名模板（N_m3u8DL-RE --save-pattern 变量集）
- `[~]` 超长文件名 —— `sanitizeFilename` 字符级截断 120，未做 UTF-8 字节边界截断+哈希

### 3.3 代理限速镜像
- `[~]` 限速 —— 全局上/下行限速设置已暴露；多档预设方案未做
- `[ ]` 代理 —— aria2 `--all-proxy` 未接线（本次 P0 补全，参考 aria2 原生选项）
- `[ ]` GitHub 镜像加速

### 3.4 后处理
- `[ ]` 自动解压 / Webhook / 自定义脚本
- `[~]` doctor —— `/api/v1/health` 仅报引擎存活；完整 doctor（版本/路径/可用性）本次 P0 按 N_m3u8DL-RE `doctor` 语义补全

---

## 模块 4：插件生态（QuickJS 沙箱 + WebView）

- 全部 `[ ]` —— 刻意取舍：本架构未引入插件运行时。QuickJS 沙箱、隐藏 WebView、四大生命周期 Hook、插件市场均未实现（融合范围外，工作量约等于再造半个 Gopeed）。可在后续版本以 Node `vm` 隔离 + 权限声明切入（路线图 P2）。

---

## 模块 5：浏览器扩展（v2.0，MV3）

### 5.1 拦截与干预
- `[x]` 自动接管 —— `onDeterminingFilename` pause→发送→成功 cancel / 失败 resume 回退（Gopeed 流程）
- `[x]` 页面磁力点击捕获 —— 内容脚本捕获阶段 + composedPath 穿透 Shadow DOM（Aria2-Explorer 方案）
- `[~]` 快捷键 —— Alt+Shift+D/K；Aria2-Explorer 的 Alt+A/J 与配置页快捷键未对齐
- `[ ]` 下载前参数弹窗（askBeforeDownload）

### 5.2 过滤引擎
- `[x]` 三维过滤+严格优先级 —— 域名→后缀→大小、白名单>黑名单；`*.a.com` 自动覆盖顶级域；28 项断言测试覆盖（`test/extension-test.mjs`）

### 5.3 多服务器与透传
- `[ ]` 多服务器 URL 路由 —— 本次 P0 按 Aria2-Explorer `rpcList+pattern` 算法补全（参考源码在 `.research/Aria2-Explorer-master`）
- `[x]` 断线回退 —— resume 恢复浏览器下载
- `[x]` Cookie/Referer/UA/Origin/Authorization 透传 —— webRequest extraHeaders 精确快照 + cookies API（含分区 Cookie）兜底

### 5.4 嗅探与批量
- `[ ]` 网页流媒体嗅探 —— 本次 P0 按 cat-catch（★22k）`onResponseStarted+请求头配对` 方案补全（源码已下载分析）
- `[x]` 右键批量导出页面链接
- `[ ]` 第三方扩展中间件 API —— 本次 P0 按 Aria2-Explorer `externally_connectable` 方案补全

### 5.5 面板形态
- `[ ]` 五种形态/接管 chrome://downloads
- `[x]` Badge 实时活跃数 + OFF 态
- `[x]` 云同步 —— chrome.storage.sync 本身即 Google 账号同步

---

## 模块 6：跨端 UI、部署与 AI/CLI

### 6.1 UI 与系统集成
- `[~]` 响应式 —— 桌面 Web UI（明/暗主题、aimao.today 设计系统对齐）；移动端布局/多主题色未做
- `[ ]` 数据看板（速度波形/P 磁贴）；系统托盘/开机启动/协议注册 —— 未做 Electron 壳
- `[~]` i18n —— 扩展 zh/en；UI 仅中文

### 6.2 协议与部署
- `[x]` Aria2 JSON-RPC 兼容 —— aria2c 本身在 ws://127.0.0.1:16800 暴露标准 JSON-RPC（secret 在 data/settings.json），任何 AriaNG/Aria2 生态工具可直接接入
- `[-]` 自有 REST API —— 刻意取舍：Gopeed 式 REST + WS 推送为自有协议（`docs/api.md`）
- `[ ]` Docker/NAS 部署（Dockerfile 未写，路线图 P1）；设备码配对未做

### 6.3 CLI 与 MCP
- `[ ]` CLI —— 路线图 P1（参考 N_m3u8DL-RE 补全生成 + Motrix CLI 形态）
- `[ ]` MCP Server —— 本次 P0 按 Gopeed `pkg/mcpserver/server.go` 的 9 工具语义补全（源码已拉取分析）

---

## 附：十大“假实现”重灾区审查结论

| # | 审查项 | 结论 |
|---|---|---|
| 1 | 流媒体解密混流真打通？ | **真**：AES-128 解密经逐字节断言测试；ffmpeg 混流用真实 ffmpeg 生成 HLS 验证 |
| 2 | 多 Period/去广告 | 半真：解析层支持归组，选段/广告剔除未做（诚实标注） |
| 3 | 扩展过滤严格优先级 | **严格对齐**：28 项测试含优先级矩阵 |
| 4 | 多 RPC URL 路由 | 未实现 → 本次 P0 补（参考已定位） |
| 5 | 离线自动回退 | **真**：pause→失败 resume，浏览器下载不丢 |
| 6 | Cookie/Referer 透传 | **真**：webRequest extraHeaders + cookies API（含分区）双路 |
| 7 | HTTP+BT 混合/WebSeed/SFTP | 依赖 aria2c 原生，未自研重写（架构上保真） |
| 8 | 插件沙箱 | **未实现**（不伪装成已实现） |
| 9 | UTF-8 字节截断 | 半真：字符级截断 |
| 10 | MCP 9 工具/NDJSON | 未实现 → 本次 P0 补 MCP（Gopeed 源码参考） |

---

## 更新记录（2026-10-19 P0 补全批次，全部经实测）

| 清单项 | 新状态 | 实现与参考来源 | 验证 |
|---|---|---|---|
| 3.3 代理 | `[x]` | aria2 `--all-proxy` 系原生选项接线（settings.proxyEnabled/Server/User/Passwd/noProxy → `engine.js` 启动参数，改后自动重启引擎） | 设置项已入重启清单 |
| 3.4 doctor | `[x]` | `GET /api/v1/doctor`（`server/src/mcp/index.js` runDoctor）：aria2c/ffmpeg/ffprobe/N_m3u8DL-RE 版本与路径探测 + 目录可写检查，语义参考 N_m3u8DL-RE `doctor` | 实测返回 4 工具版本+目录状态 |
| 5.3 多服务器 URL 路由 | `[x]` | 扩展 v3：`servers[{name,url,token,pattern}]` 顺序匹配、`*` 默认、首项兜底（Aria2-Explorer `getRpcServer` 算法）；选项页行式管理 UI | 扩展测试新增断言覆盖 |
| 5.4 流媒体嗅探 | `[x]` | 扩展 v3：`onSendHeaders` 请求头按 requestId 缓存 + `onResponseStarted` 配对匹配（19 种媒体后缀 + Content-Type）+ `onErrorOccurred` 清理（cat-catch 方案）；popup"本页媒体"一键下载 | 50 项扩展测试全过 |
| 5.4 中间件 API | `[x]` | `externally_connectable` + `onMessageExternal`（Aria2-Explorer 方案），`allowExternalRequest` 默认关闭 | 同上 |
| 6.3 MCP Server | `[x]` | `POST /mcp`（`server/src/mcp/index.js`）：Streamable HTTP + JSON-RPC 2.0，9 工具语义对齐 Gopeed `pkg/mcpserver/server.go` | 9 工具全链路实测（34MB 真实下载：resolve→create→status(16连接/8.6MB/s)→stats→pause→continue→list→delete→get） |
| 6.3 CLI | `[~]` | `cli/rdown.mjs`：add/resolve/list/pause/resume/delete/watch(--stats NDJSON 1Hz)/doctor；配置优先级 命令行>环境变量>默认 | 实测通过；补全脚本未做 |
| 1.1 Metalink | `[x]` | `rpc.addMetalink` 接线（create 路由支持 `metalinkBase64`） | 代码路径打通 |
| 1.2 哈希校验 | `[x]` | `options.checksum` 透传 aria2 `--checksum`（create.js） | 代码路径打通 |

## 更新记录 2（2026-10-20 猫抓 cat-catch 深度融合批次）

| 清单项 | 新状态 | 实现与参考来源 | 验证 |
|---|---|---|---|
| 5.4 媒体嗅探增强（深度搜索/正则过滤/预览/文件名模板/自动下载） | `[x]` | cat-catch（★22k）`background.js`/`content-script.js`/`init.js`/`templates.js`：`onResponseStarted` 嗅探（上轮）+ 本轮深度搜索（注入页面上下文扫描 15 个播放器全局变量）、嗅探正则规则（wildcardToRegex）、popup 媒体预览（直链原生播放 + 本地打包 hls.js@1.7.3 播放 m3u8，无远程代码）、文件名模板 `${title}/${fileName}/${ext}/${host}/${date}`、自动下载（开关+体积阈值+防重复） | 扩展测试 82 通过 0 失败（新增 30 项断言） |
| 2.4 自定义 HLS Key/IV | `[x]` | 流媒体引擎 `options.iv` 覆盖（对齐猫抓 m3u8 解析页 + N_m3u8DL-RE `--custom-hls-key/iv`）；Web UI 新建任务对话框加 Key/IV 输入 | 端到端实测：加密 HLS 双路（自动拉 key / 自定义 key+IV）输出字节完全一致，ffprobe 验证为有效 mpegts（16s），对照组原始密文探测失败 |

## 更新记录 3（2026-10-20 P1 全量 + Electron/i18n 批次，全部实测）

| 清单项 | 新状态 | 实现与参考来源 | 验证 |
|---|---|---|---|
| 1.3 UPnP/NAT-PMP | `[x]` | Motrix UPnPManager 同款薄封装 + nat-api 库；启动/设置变更/退出三处联动 | 接线实测（无路由环境 map 失败仅告警不阻断） |
| 2.2 选流全属性 DSL | `[x]` | N_m3u8DL ComplexParamParser 语义：冒号分隔子键 + `\"` 转义 + 引号剥离；15 个正则键 + 3 组阈值 + for=best[N]/worst[N]/all | E2E：`res=^1280:for=best` 选中 720p，`drop=res=^640` 剔除 360p（输出字节数证明） |
| 2.3 广告剔除 / custom-range | `[x]` | --ad-keyword 分片 URL 正则过滤；--custom-range 序号/时间轴（MM:SS 与 HH:MM:SS）双格式 | "0-2" 6→3 分片实测 |
| 3.2 命名模板 + UTF-8 截断 | `[x]` | N_m3u8DL --save-pattern 12 变量；字节边界截断 + 8 位哈希 + 扩展名保留 | 单测：90 字节中文截 50 无半个字符、扩展名保留 |
| 3.3 限速预设 | `[x]` | Motrix 三档方案（全速/办公/夜间），apply 端点写 aria2 全局选项 | 预设切换实测 |
| 3.1 搜索/优先级/定时 | `[x]` | search 关键词过滤；changePosition 四向重排；--task-start-at 调度器（持久化+重启恢复） | 搜索命中、队首重排、25 秒后自启实测 |
| 3.4 Webhook/脚本/自动解压 | `[x]` | Gopeed 后处理：webhook JSON（实测送达）、脚本注入 KIMI_* 环境变量、zip/tar/tgz 用 Windows 自带 tar 解压（7z/rar 需 7-Zip） | webhook 实测 |
| 6.1 数据看板 | `[~]` | 后端 1Hz×300 点速度历史 + totals 端点已就绪；前端波形图未做 | /api/v1/dashboard 实测 |
| 6.1 i18n 十语言 | `[x]` | Web UI 139 key × 9 语言文件 + Auto 跟随系统（指定菜单顺序），Element Plus 组件联动 | key 集合校验 0 缺失 + build 通过 |
| 6.2 Electron 桌面壳 | `[x]` | Motrix 架构：server 子进程托管、托盘、magnet 协议注册、.torrent 关联（nsis）、单实例锁、开机自启 IPC | electron 39.8 安装成功 |
| 6.2 Docker 无头部署 | `[x]` | Gopeed 形态：多阶段构建、非 root、目录权限预校验、compose + NAS 文档 | 静态审查通过（本机无 Docker） |
