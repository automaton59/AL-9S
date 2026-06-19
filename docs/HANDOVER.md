# AL-1S 交接文档

最后更新：2026-06-19
当前阶段：Phase 1 已完成
下一阶段：Phase 2，人格、关系、记忆与角色资产

## 1. 当前状态

AL-1S 目前已经从最初的基础聊天 Demo 进入到可用的 Phase 1 桌面应用状态。当前产品方向不是“工作台”，也不是 SillyTavern 式剧情工具，而是一个本地优先的私人 IM 陪伴应用：用户打开后应当像进入一段稳定的聊天关系，而不是进入一套复杂的设定编辑器。

Phase 1 的核心结果：

- Electron + Vite 开发流程可用，`npm start` 会启动 Vite 并打开 Electron 应用。
- 浏览器开发模式仍可用，但真实长期使用以 Electron 为主。
- 支持多 API profile，profile 与 key 配对保存，下次启动可直接选择。
- Electron 下 API key 使用 `safeStorage` 加密后写入本机用户数据目录。
- 支持多角色、多会话，且会话绑定角色。
- 支持发送、撤回并打断请求、编辑消息、重新生成、删除后续。
- 默认聊天体验是完整回复出现，不做逐字流式展示。
- 主聊天不显示 thinking/reasoning，也不显示裸露的情绪标签。
- UI 已调整为更接近私人 IM：联系人列表、聊天气泡、角色状态、底部输入栏、柔和亮暗主题。
- 已加入独立应用设置页，支持 `system`、`light`、`dark` 三种主题模式。

## 2. 如何运行

安装依赖：

```bash
npm install
```

启动 Electron 开发版：

```bash
npm start
```

仅启动浏览器开发服务器：

```bash
npm run dev
```

构建前端：

```bash
npm run build
```

编译 Electron 主进程：

```bash
npm run electron:compile
```

当前 `electron:compile` 使用 `tsconfig.electron.json`，避免了早期 `tsc electron/main.ts ...` 与 `tsconfig.json` 冲突导致的 TS5112 问题。

## 3. 数据位置与安全

Electron 版本的数据不写入仓库目录，而是写入 Electron 的 `userData` 目录：

```text
%APPDATA%\al-1s\data\
```

当前文件：

- `config.json`：角色、当前角色、当前 API profile id、主题等应用配置。
- `chat-history.json`：会话和消息记录。
- `api-profiles.json`：API profile 列表。API key 字段不会以普通明文保存。

API key 处理方式：

- Electron 下优先使用 `safeStorage.encryptString()`，保存为 base64，并标记为 `safe:v1`。
- 如果 `safeStorage` 不可用，会降级为 `plain:fallback`。这主要用于开发或特殊环境，不建议作为长期真实使用方式。
- 浏览器开发模式没有 Electron IPC 和 `safeStorage`，会 fallback 到 localStorage。浏览器里一打开就有 API 配置，通常是因为之前开发模式已经在 localStorage 里留下了 `al-1s-file:*` 数据。

仓库已在 `.gitignore` 中兜底忽略：

- `data/`
- `secrets/`
- `*.local.json`
- `api-profiles*.json`
- `config.local.json`
- `chat-history.local.json`

提交前仍建议搜索一次真实 key 前缀，确认没有被写入源码、测试数据或文档。

## 4. Phase 1 已完成能力

### 4.1 API Profile

- 新建、选择、保存、删除 profile。
- profile 包含 provider、baseURL、model、temperature、maxTokens、lastConnectedAt 等字段。
- 支持测试连接和拉取模型列表。
- 当前 `llmConfig` 从 active profile 派生，不再把 key 散落在普通配置里。

### 4.2 本地存储

- Electron IPC 存储桥：`storage:read`、`storage:write`、`storage:delete`。
- Electron secret 桥：加密和解密 API key。
- 浏览器模式用 localStorage 模拟文件存储，保持开发可用。
- 首次启动会兼容迁移旧的 localStorage 数据，旧数据不会被自动删除。

### 4.3 聊天行为

- 用户发送后，角色状态进入“正在输入...”。
- 发送中的用户消息支持撤回，撤回会 abort 当前请求并移除该消息。
- 请求成功后追加完整助手消息，状态回到“在线”。
- 请求失败时保留用户消息并标记失败，同时显示错误。
- 支持用户和助手消息编辑。
- 支持从用户消息或助手消息重新生成。
- 支持删除某条消息之后的全部后续消息。
- 切换会话时 pending 状态不再跨会话显示。
- thinking/reasoning 只作为底层解析信息，不作为聊天正文展示。
- 情绪标签会从文本里剥离，只作为 `emotion` 元数据保留，为后续头像、表情、Live2D 或视频聊天准备。

### 4.4 角色与会话

- 支持多角色。
- 支持多会话。
- 每个会话绑定一个角色。
- 角色卡目前是内部结构化资料，不走世界书或复杂设定集方向。
- 角色相关配置仍处于 Phase 1 的基础形态，Phase 2 需要把它升级为更稳定的人格、关系与记忆系统。

### 4.5 UI 与主题

- 主界面已从工作台感调整为私人聊天空间。
- 会话列表更接近联系人列表。
- 角色卡和设置不抢主聊天视线。
- 独立设置页包含 API 设置、角色设置、应用设置。
- 支持 `system`、`light`、`dark`。
- 主题会同步到 Electron `nativeTheme.themeSource`。
- 原生下拉框已替换为 `SelectMenu`，风格和暗色模式统一。

## 5. 架构地图

Electron：

- `electron/main.ts`：窗口创建、菜单处理、存储 IPC、secret IPC、主题 IPC。
- `electron/preload.ts`：向渲染进程暴露受控的 `window.electron` API。
- `src/types/electron.d.ts`：Electron preload 类型定义。

存储与配置：

- `src/services/storage/index.ts`：Electron 文件存储与浏览器 fallback 的统一包装。
- `src/services/apiProfiles.ts`：API profile 的创建、保存、加密、解密、迁移。
- `src/services/config/index.ts`：应用配置的默认值、归一化、保存。
- `src/services/chatHistory.ts`：会话和消息历史持久化。
- `src/services/theme.ts`：主题解析、应用、系统主题监听、Electron 主题同步。

LLM：

- `src/services/llm/index.ts`：LLM service 工厂。
- `src/services/llm/openai.ts`：OpenAI-compatible 适配器，请求、abort、reasoning 抽取、情绪标签剥离。
- `src/services/llm/modelDiscovery.ts`：模型列表发现。
- `src/services/llm/http.ts`：HTTP 辅助逻辑。
- `src/services/llm/endpoints.ts`：常见 provider endpoint。

状态：

- `src/stores/settings.ts`：配置、profile、角色、主题、连接测试等状态。
- `src/stores/chat.ts`：会话、消息、pending 请求、撤回、重新生成、删除后续。

UI：

- `src/components/Chat/`：聊天窗口、消息列表、单条消息、输入栏。
- `src/components/Character/CharacterCard.tsx`：角色卡展示。
- `src/components/Settings/`：API、角色、应用设置页。
- `src/components/UI/SelectMenu.tsx`：自定义下拉菜单。
- `src/index.css`：主题变量、布局、气泡、暗色模式等全局样式。

## 6. 当前遗留问题

这些不是 Phase 1 阻塞项，但 Phase 2 接手前应当心里有数：

- 自动化测试仍不足。当前主要依赖手动验证和构建验证。
- Electron 打包为正式 exe 的发布流程还没有完整跑通。
- 浏览器开发模式会用 localStorage fallback 保存数据，API key 安全性弱于 Electron。
- 当前本地数据层是 JSON 文件和 localStorage 兼容包装，Phase 2 需要重新评估结构化程度、迁移、备份、查询能力和崩溃恢复。
- 还没有长期记忆、关系档案、上下文裁剪、总结、检索和可编辑记忆管理。
- 角色资料仍偏基础，需要和人格稳定、关系发展、记忆系统合并设计。
- 当前还没有角色资产导入导出、头像/表情资源目录、备份恢复。
- reasoning 虽然被隐藏，但底层字段仍存在，后续需要明确哪些数据应保存、哪些只用于一次响应调试。
- 文档中可能仍有早期 Phase 1 状态文件残留，例如 `docs/phase1-current-status.md`，接手时要以本文档和路线图为准。

## 7. Phase 2 目标

Phase 2 建议命名为：人格、关系、记忆与角色资产。

它合并了早先拆开的“记忆系统”和“角色管理”方向。理由是二者的真实产品目标一致：让 AL-1S 在长期聊天中保持稳定的人格、持续的关系感、可追溯的共同经历，以及可迁移的角色资料。

Phase 2 不应做成世界书或设定集系统。这个项目不是剧情跑团工具；如果用户想玩复杂剧情，SillyTavern 已经是更合适的工具。

### 7.1 本地数据层评估

不要提前把方案锁死为 SQLite。JSON 不是完全不可用，关键看 Phase 2 的数据需求。

建议评估维度：

- 数据规模：长期聊天后消息数量、记忆条目、资产索引会增长到什么量级。
- 查询方式：是否需要按会话、角色、时间、关键词、记忆类型频繁查询。
- 写入安全：是否需要原子写、备份、回滚、崩溃恢复。
- 迁移成本：从当前 `config.json`、`chat-history.json`、`api-profiles.json` 迁移是否简单可靠。
- 可调试性：用户或开发者是否需要直接读懂和手动修复数据。
- 跨平台能力：Electron、未来移动端、浏览器 fallback 是否能接受同一套抽象。

可选路线：

- 继续 JSON：适合数据量中等、结构清晰、需要可读可备份的本地优先方案。需要补齐 schema version、原子写、备份、校验、迁移脚本。
- SQLite：适合消息量大、查询复杂、需要事务和索引的方案。需要处理依赖、打包、迁移、跨平台兼容。
- 分层方案：配置和 profile 继续 JSON，消息、记忆、索引进入 SQLite 或其他本地数据库。

Phase 2 的第一步应当是写出数据模型和迁移策略，再决定最终落地方案。

### 7.2 人格与角色资料

目标不是堆设定，而是让角色像一个稳定联系人。

建议数据包括：

- 基本资料：姓名、称呼、头像、简介、默认语气。
- 人格核心：稳定价值观、表达习惯、边界、关系态度。
- 互动偏好：用户喜欢的聊天密度、称呼、玩笑尺度、回复长度。
- 关系状态：熟悉程度、重要共同经历、当前关系基调。
- 角色资源：头像、未来表情图、Live2D 或视频聊天资产目录。
- Prompt 装配字段：哪些信息长期进入系统提示，哪些按上下文动态进入。

### 7.3 记忆与上下文

建议把记忆分为几类：

- 用户资料：用户明确告诉 AL-1S 的基本信息。
- 关系记忆：两人之间的重要事件、承诺、习惯、称呼、共同梗。
- 偏好记忆：用户喜欢或讨厌的聊天方式、话题、边界。
- 事实记忆：可长期保存的明确事实。
- 临时上下文：当前会话近期需要保留，但不应永久沉淀的信息。

必须提供的能力：

- 自动抽取候选记忆。
- 用户可查看、编辑、删除、置顶记忆。
- 记忆来源可追溯到消息或时间。
- 上下文装配可解释，避免把过期或错误记忆反复塞进 prompt。
- 长聊天可以总结，但总结需要可编辑、可回滚。

### 7.4 角色卡导入导出

Phase 2 可以做角色资料导入导出，但应服务于 AL-1S 的产品目标：

- 内部格式优先。
- 支持 JSON 导入导出，便于备份和迁移。
- 可以考虑兼容常见角色卡字段，但不把 SillyTavern 完整兼容作为核心目标。
- 不做世界书、设定集、剧情书式功能作为主线。
- 资源文件要有明确目录和引用方式，避免头像、表情、Live2D 资产散落。

### 7.5 备份、恢复与迁移

Phase 2 必须补上：

- 数据 schema version。
- 从 Phase 1 JSON 数据迁移到 Phase 2 数据层。
- 备份导出。
- 备份恢复。
- 迁移失败的回滚或保留旧数据策略。
- 敏感字段过滤，导出包默认不包含 API key，除非用户明确选择。

## 8. Phase 3 方向

Phase 3 建议聚焦：角色存在感与视频聊天。

这部分不是 Phase 2 的核心，但 Phase 2 应当为它预留数据结构：

- 情绪和状态管线。
- 头像和表情切换。
- Live2D 资产接入。
- 视频聊天式界面。
- TTS 和语音输入可以作为这一阶段或之后的子任务。
- 情绪标签当前已经在底层保留为 metadata，后续可用于驱动表情或动作，但不应在普通聊天文本中出现。

## 9. Phase 4+ 功能池

Phase 4 之后不建议写成“统一打磨阶段”。质量、测试、安全、文档每个版本都要做。

后续功能池可以包括：

- 正式打包和发布：Windows exe、macOS dmg、Linux AppImage。
- 移动端聊天：PWA、React Native、Capacitor 或原生方案再评估。
- 工具调用：天气、时间、日程、网页搜索、本地文件等。
- 主动聊天：在用户可控和低打扰的前提下做。
- 插件或技能系统。
- 云同步或多端同步，但默认仍保持本地优先。
- 更完整的导入导出和数据可视化。

## 10. 接手检查清单

接手开发前建议跑一遍：

- `npm install`
- `npm run build`
- `npm run electron:compile`
- `npm start`
- 新建一个 API profile，测试连接，拉取模型。
- 重启应用，确认 profile 和 key 仍可用。
- 发送消息、撤回、重新生成、删除后续、编辑用户消息。
- 新建角色、新建会话、切换会话，确认 pending 状态不串台。
- 切换 `system/light/dark`，确认 UI 和 Electron 原生主题同步。
- 检查 `%APPDATA%\al-1s\data\` 下数据是否符合预期。
- 提交前搜索真实 API key，确认没有进入仓库。

## 11. 文档优先级

当前以这两份文档为准：

- `docs/PROJECT-BACKGROUND-AND-ROADMAP.md`
- `docs/HANDOVER.md`

早期计划、早期 self-check 和 Phase 1 状态文档可能仍有历史价值，但不再代表当前产品路线。
