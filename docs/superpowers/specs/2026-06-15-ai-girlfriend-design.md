# AI 女友项目设计文档

**日期：** 2026-06-15  
**版本：** 1.0  
**状态：** 设计中

---

## 项目概述

### 项目目标

构建一个开源的 AI 女友应用，支持多平台（桌面 + 移动），提供自然的对话体验、记忆系统、角色自定义和情感互动。

### 核心定位

- **开源项目**：代码完全开源，社区驱动
- **本地优先**：数据存储在用户本地，隐私优先
- **模块化设计**：支持渐进式增强，便于扩展
- **API 中立**：支持多种 LLM API，用户自主选择

### 技术特点

- 纯本地运行（方案 A）+ 自托管支持（方案 D）
- 跨平台：Electron（桌面）+ PWA（移动）
- 前端驱动，可选后端服务（第二阶段）
- 兼容 SillyTavern 角色卡格式

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端应用层                            │
│  React + TypeScript + Electron/PWA                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   服务抽象层（接口）                      │
│  LLM Service | Memory Service | TTS Service             │
└─────────────────────────────────────────────────────────┘
          ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 前端轻量实现      │  │ 前端轻量实现      │  │ 前端轻量实现      │
│ • 直接调 API     │  │ • 前端向量库     │  │ • Web Speech    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```


### 核心设计原则

1. **接口抽象**：所有服务通过接口定义，支持多种实现
2. **配置驱动**：通过配置文件切换不同实现
3. **渐进式增强**：MVP 纯前端，后续可添加本地后端
4. **模块化**：功能模块独立，便于维护和扩展

### 技术选型

| 模块 | 技术方案 | 备注 |
|------|---------|------|
| 前端框架 | React 18 + TypeScript | 组件化开发 |
| 桌面端 | Electron | 跨平台打包 |
| 移动端 | PWA | Web 技术栈复用 |
| 状态管理 | Zustand | 轻量级 |
| 本地数据库 | SQLite (sql.js) | 纯 JS 实现 |
| 向量检索 | @vectra/core | 前端向量库 |
| UI 组件 | TailwindCSS + shadcn/ui | 现代化设计 |
| LLM API | 用户配置 | 支持 OpenAI/Anthropic/Deepseek/自定义 |
| Embedding | Jina AI / OpenAI | 向量化服务 |
| TTS | Web Speech API / 远程 API | 可选方案 |

---

## 核心模块设计

### 1. LLM 服务模块

**接口定义：**

```typescript
interface LLMService {
  chat(params: ChatParams): Promise<ChatResponse>;
  streamChat(params: ChatParams): AsyncIterator<ChatResponse>;
}

interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}
```


**支持的 API 提供商：**

- OpenAI (GPT-4, GPT-4o, GPT-5)
- Anthropic (Claude Sonnet, Opus)
- Deepseek (推荐，性价比高)
- 国内大模型（文心、通义、智谱）
- 自定义端点（兼容 OpenAI 格式）

**配置示例：**

```json
{
  "llm": {
    "provider": "deepseek",
    "apiKey": "sk-xxx",
    "model": "deepseek-chat",
    "baseURL": "https://api.deepseek.com",
    "temperature": 0.8,
    "maxTokens": 2000
  }
}
```

### 2. 记忆服务模块

**接口定义：**

```typescript
interface MemoryService {
  saveMessage(message: Message): Promise<void>;
  searchRelevant(query: string, limit: number): Promise<Memory[]>;
  getRecentMessages(limit: number): Promise<Message[]>;
  getCoreMemories(): Promise<CoreMemory[]>;
  updateCoreMemory(memory: CoreMemory): Promise<void>;
}
```

**实现方案：**

- **短期记忆**：最近 N 条消息直接放入上下文
- **长期记忆**：向量化存储，相似度检索
- **核心记忆**：结构化字段（用户姓名、职业、偏好等）

**向量检索流程：**

1. 用户输入 → 生成 embedding 向量
2. 在历史消息中搜索相似向量
3. 返回 top-k 相关记忆
4. 组合：系统提示 + 核心记忆 + 相关记忆 + 最近对话

**Embedding 提供商：**

- Jina AI (免费 1M tokens/月)
- OpenAI text-embedding-3-small ($0.02/1M tokens)

### 3. TTS 服务模块

**接口定义：**

```typescript
interface TTSService {
  speak(text: string, options?: TTSOptions): Promise<void>;
  getVoices(): Promise<Voice[]>;
}
```

**支持方案：**

- Web Speech API（浏览器原生，零成本）
- 远程 TTS API（火山引擎、OpenAI TTS）
- 本地模型（GPT-SoVITS，第二阶段）

### 4. 角色管理模块

**角色数据结构：**

```typescript
interface Character {
  id: string;
  name: string;
  avatar: string;
  persona: CharacterPersona;
  expressions: Record<string, string>;  // emotion -> image path
  tavernCard?: TavernCharacterCard;
}
```

**人设自定义方式：**

1. **结构化表单（默认）**：引导用户填写基本信息、性格、说话风格等
2. **预设模板**：提供 5-10 个预设角色，快速开始
3. **自由文本**：高级用户直接写完整 prompt
4. **导入角色卡**：兼容 SillyTavern PNG 格式（V2/V3）

**SillyTavern 兼容性：**

- 解析 PNG 的 tEXt chunk（chara/ccv3）
- 转换为内部格式
- 支持导出为标准格式

### 5. 表情驱动模块

**情绪检测方案：LLM 内联标注**

在系统提示中要求 AI 标注情绪：

```
重要：在每次回复末尾用 [emotion: happy] 标注当前情绪。
支持：neutral, happy, sad, angry, shy, excited, worried
```

**解析逻辑：**

```typescript
function parseEmotion(text: string): { content: string; emotion: Emotion } {
  const match = text.match(/\[emotion:\s*(\w+)\]/);
  return {
    content: text.replace(/\[emotion:\s*\w+\]/, '').trim(),
    emotion: match?.[1] || 'neutral'
  };
}
```

**表情切换：**

根据检测到的情绪，切换对应的立绘图片。

---

## 数据模型

### 数据库设计（SQLite）

**核心表结构：**

1. **users** - 用户表
2. **characters** - 角色表
3. **conversations** - 对话会话表
4. **messages** - 消息表
5. **core_memories** - 核心记忆表（结构化）
6. **scheduled_messages** - 定时消息表
7. **tool_calls** - 工具调用记录表
8. **settings** - 配置表

**关键字段：**

```sql
-- 消息表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  emotion TEXT,
  embedding BLOB,  -- 向量 embedding
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 核心记忆表
CREATE TABLE core_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  key TEXT NOT NULL,  -- 如 'user_name', 'user_job'
  value TEXT NOT NULL,
  source TEXT,  -- 'user_input' | 'extracted'
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, character_id, key)
);
```

### 配置文件

**位置：** `~/.ai-girlfriend/config.json`

**配置结构：**

```json
{
  "version": "1.0.0",
  "user": {
    "id": "user_123",
    "activeCharacterId": "char_456"
  },
  "services": {
    "llm": {
      "provider": "deepseek",
      "apiKey": "sk-xxx",
      "model": "deepseek-chat",
      "baseURL": "https://api.deepseek.com",
      "temperature": 0.8,
      "maxTokens": 2000
    },
    "embedding": {
      "provider": "jina",
      "apiKey": "jina_xxx"
    },
    "tts": {
      "provider": "web-speech",
      "voice": "zh-CN-XiaoxiaoNeural",
      "rate": 1.0,
      "pitch": 1.0
    }
  },
  "features": {
    "proactiveMode": false,
    "scheduledGreetings": true,
    "toolCalling": false
  }
}
```

---

## 关键功能设计

### 主动对话系统

**核心挑战：** 如何自然地主动找人

**分阶段实现：**

#### 第一阶段：定时问候

```typescript
const DEFAULT_GREETINGS = [
  { time: "08:00", templates: ["早上好～", "早安！"] },
  { time: "12:00", templates: ["中午啦，记得吃饭哦～"] },
  { time: "22:00", templates: ["晚安，早点休息～"] }
];
```

#### 第二阶段：智能主动（可选功能）

**触发条件：**

1. **时间间隔**：2 小时无互动，且在活跃时段（9:00-23:00）
2. **上下文相关**：用户昨天提到今天有重要事情
3. **外部事件**：天气变化、新闻热点等

**频率控制：**

- 最小间隔：2 小时
- 每日上限：3 次
- 免打扰时段：用户可配置
- 连续忽略检测：2 次未回复则停止主动

**话题生成：**

通过 LLM 根据上下文生成自然的主动消息：

```typescript
const prompt = `
你想主动找用户聊天。
最近对话：${recentMessages}
核心记忆：${coreMemories}

生成一条自然的主动消息（1-2句话）。
可以是：关心、分享、提醒、闲聊。
`;
```

### 工具调用系统（预留）

**支持的工具：**

- `get_weather` - 查询天气
- `search_web` - 网络搜索
- `get_current_time` - 获取时间
- 更多工具可扩展...

**实现方式：**

遵循 OpenAI Function Calling 格式，兼容多种 LLM。


---

## MVP 功能清单

### 核心功能（必须）

**1. 基础对话**
- [x] 文本输入/输出
- [x] 流式响应（打字效果）
- [x] 对话历史显示
- [x] 多 LLM API 支持
- [x] 消息编辑/重新生成
- [x] 代码高亮显示

**2. 角色管理**
- [x] 创建角色（结构化表单）
- [x] 预设角色模板（5-10个）
- [x] 自由文本模式（高级）
- [x] 导入 SillyTavern 角色卡（PNG）
- [x] 导出角色卡（PNG/JSON）
- [x] 多角色管理和切换

**3. 视觉呈现**
- [x] 静态立绘显示
- [x] 表情切换（6-8种基础情绪）
- [x] LLM 内联情绪标注
- [x] 自定义表情包上传

**4. 记忆系统**
- [x] SQLite 对话历史存储
- [x] 向量检索（vectra.js + Jina/OpenAI embedding）
- [x] 最近 N 条消息上下文
- [x] 核心记忆（手动填写 + 自动提取）
- [x] 记忆管理界面
- [x] 长期记忆总结

**5. 语音功能**
- [x] TTS（Web Speech API / 远程 API）
- [x] 语音输入（Web Speech Recognition / Whisper API）

**6. 主动对话**
- [x] 定时问候（可配置时间）
- [x] 智能主动模式（第二阶段，可选）

**7. 会话管理**
- [x] 多会话支持
- [x] 会话列表（侧边栏）
- [x] 会话重命名/删除
- [x] 会话搜索
- [x] 分支对话（类似 ChatGPT）

**8. 设置和配置**
- [x] API 配置（多提供商支持）
- [x] 角色选择
- [x] TTS 配置
- [x] 定时问候设置
- [x] 主题切换（亮/暗）
- [x] 对话背景自定义
- [x] 字体大小调整

**9. 数据管理**
- [x] 数据导出（SQLite + 资源文件）
- [x] 数据导入/恢复
- [x] 消息导出（Markdown/JSON）

**10. 统计面板**
- [x] 对话统计（消息数、时长）
- [x] API 使用统计（token 消耗、成本）
- [x] 情绪统计（情绪分布图）

**11. 平台支持**
- [x] Electron 桌面应用（Windows/Mac/Linux）
- [x] PWA 移动端（第二阶段）

### 第二阶段功能

- [ ] 本地后端服务（可选）
- [ ] Qdrant 向量数据库
- [ ] 本地 TTS 模型（GPT-SoVITS）
- [ ] 工具调用（天气、搜索等）
- [ ] WebRTC 视频通话
- [ ] 移动端原生优化

### 第三阶段功能

- [ ] Live2D 动态立绘
- [ ] 更多工具集成
- [ ] 角色社区/市场
- [ ] 云同步（可选付费服务）

---

## 项目结构

```
ai-girlfriend/
├── electron/                   # Electron 主进程
│   ├── main.ts                # 主进程入口
│   └── preload.ts             # 预加载脚本
│
├── src/                        # 前端源码
│   ├── components/            # React 组件
│   │   ├── Chat/             # 对话界面
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── InputBar.tsx
│   │   │   └── MessageItem.tsx
│   │   ├── Character/         # 角色管理
│   │   │   ├── CharacterList.tsx
│   │   │   ├── CharacterEditor.tsx
│   │   │   ├── PersonaForm.tsx
│   │   │   └── ExpressionUpload.tsx
│   │   ├── Settings/          # 设置面板
│   │   │   ├── APISettings.tsx
│   │   │   ├── TTSSettings.tsx
│   │   │   └── GeneralSettings.tsx
│   │   ├── Avatar/            # 立绘显示
│   │   │   ├── AvatarDisplay.tsx
│   │   │   └── ExpressionManager.tsx
│   │   ├── Memory/            # 记忆管理
│   │   │   ├── MemoryPanel.tsx
│   │   │   └── CoreMemoryEditor.tsx
│   │   └── Stats/             # 统计面板
│   │       └── StatsPanel.tsx
│   │
│   ├── services/              # 服务层（核心抽象）
│   │   ├── interfaces.ts      # 统一接口定义
│   │   ├── llm/              # LLM 服务
│   │   │   ├── index.ts
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── deepseek.ts
│   │   │   └── custom.ts
│   │   ├── memory/            # 记忆服务
│   │   │   ├── index.ts
│   │   │   └── frontend.ts
│   │   ├── tts/              # TTS 服务
│   │   │   ├── index.ts
│   │   │   ├── web-speech.ts
│   │   │   └── remote.ts
│   │   ├── emotion/           # 情绪检测
│   │   │   └── detector.ts
│   │   └── proactive/         # 主动对话
│   │       └── controller.ts
│   │
│   ├── db/                    # 数据库层
│   │   ├── schema.sql        # 数据库结构
│   │   ├── client.ts         # SQLite 客户端
│   │   └── migrations/       # 数据库迁移
│   │
│   ├── utils/                 # 工具函数
│   │   ├── character-card.ts # SillyTavern 解析
│   │   ├── vector.ts         # 向量操作
│   │   └── export.ts         # 数据导出
│   │
│   ├── stores/                # 状态管理（Zustand）
│   │   ├── chat.ts
│   │   ├── character.ts
│   │   ├── settings.ts
│   │   └── memory.ts
│   │
│   ├── App.tsx               # 应用入口
│   └── main.tsx              # React 挂载
│
├── assets/                    # 资源文件
│   └── characters/           # 预设角色
│       ├── default/
│       │   ├── avatar.png
│       │   ├── expressions/
│       │   │   ├── happy.png
│       │   │   ├── sad.png
│       │   │   └── ...
│       │   └── character.json
│       └── ...
│
├── docs/                      # 文档
│   ├── README.md
│   ├── API.md                # API 文档
│   ├── CHARACTER_CARD.md     # 角色卡格式
│   └── DEPLOYMENT.md         # 部署指南
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── electron-builder.json     # Electron 打包配置
└── README.md
```

---

## 核心依赖

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "sql.js": "^1.10.3",
    "@vectra/core": "^0.5.0",
    "axios": "^1.7.0",
    "openai": "^4.77.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "marked": "^14.1.0",
    "highlight.js": "^11.10.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "electron": "^33.3.0",
    "electron-builder": "^25.1.8",
    "vite": "^6.0.0",
    "typescript": "^5.7.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

---

## 实现细节

### 服务抽象层实现

**统一接口：**

```typescript
// src/services/interfaces.ts
export interface LLMService {
  chat(params: ChatParams): Promise<ChatResponse>;
  streamChat(params: ChatParams): AsyncIterator<ChatResponse>;
}

export interface MemoryService {
  saveMessage(message: Message): Promise<void>;
  searchRelevant(query: string, limit: number): Promise<Memory[]>;
  getRecentMessages(limit: number): Promise<Message[]>;
  getCoreMemories(): Promise<CoreMemory[]>;
  updateCoreMemory(memory: CoreMemory): Promise<void>;
}

export interface TTSService {
  speak(text: string, options?: TTSOptions): Promise<void>;
  getVoices(): Promise<Voice[]>;
}
```

**工厂模式：**

```typescript
// src/services/llm/index.ts
export class LLMServiceFactory {
  static create(config: LLMConfig): LLMService {
    switch (config.provider) {
      case 'openai': return new OpenAIAdapter(config);
      case 'anthropic': return new AnthropicAdapter(config);
      case 'deepseek': return new DeepseekAdapter(config);
      case 'custom': return new CustomAPIAdapter(config);
      default: throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
```

### 情绪检测实现

**系统提示模板：**

```typescript
const SYSTEM_PROMPT_TEMPLATE = `
你是 {{character_name}}。

{{character_description}}

重要：在每次回复末尾用以下格式标注你的情绪：
[emotion: neutral|happy|sad|angry|shy|excited|worried]

示例：
用户：今天天气真好
你：是啊，要不要一起出去走走？[emotion: happy]

现在开始对话。
`;

function parseEmotion(response: string) {
  const regex = /\[emotion:\s*(\w+)\]/;
  const match = response.match(regex);
  return {
    content: response.replace(regex, '').trim(),
    emotion: match?.[1] || 'neutral'
  };
}
```

### SillyTavern 角色卡解析

```typescript
// src/utils/character-card.ts
import extract from 'png-chunks-extract';
import PNGtext from 'png-chunk-text';

export async function parseTavernCard(file: File): Promise<Character> {
  const buffer = await file.arrayBuffer();
  const chunks = extract(new Uint8Array(buffer));
  
  const textChunks = chunks
    .filter(chunk => chunk.name === 'tEXt')
    .map(chunk => PNGtext.decode(chunk.data));
  
  // 优先 V3，回退到 V2
  const ccv3 = textChunks.find(c => c.keyword.toLowerCase() === 'ccv3');
  const chara = textChunks.find(c => c.keyword.toLowerCase() === 'chara');
  
  const dataChunk = ccv3 || chara;
  if (!dataChunk) throw new Error('No character data');
  
  const json = Buffer.from(dataChunk.text, 'base64').toString('utf8');
  const card = JSON.parse(json);
  
  return convertToInternalFormat(card, file);
}
```

### 向量检索实现

```typescript
// src/services/memory/frontend.ts
import { LocalIndex } from '@vectra/core';

export class FrontendMemoryService implements MemoryService {
  private vectorIndex: LocalIndex;
  
  async searchRelevant(query: string, limit: number): Promise<Memory[]> {
    // 1. 获取 query 的 embedding
    const queryVector = await this.getEmbedding(query);
    
    // 2. 向量相似度搜索
    const results = await this.vectorIndex.queryItems(queryVector, limit);
    
    // 3. 返回相关消息
    return results.map(r => ({
      content: r.item.metadata.text,
      timestamp: new Date(r.item.metadata.timestamp),
      relevanceScore: r.score,
      type: 'conversation'
    }));
  }
  
  async getEmbedding(text: string): Promise<number[]> {
    // 调用 Jina AI embedding API
    const response = await axios.post('https://api.jina.ai/v1/embeddings', {
      input: text,
      model: 'jina-embeddings-v2-base-zh'
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return response.data.data[0].embedding;
  }
}
```

---

## 扩展性设计

### 预留的扩展点

**1. 后端服务切换**

前端实现 → 后端实现，通过配置切换：

```json
{
  "services": {
    "llm": "frontend",      // 或 "backend"
    "memory": "frontend",    // 或 "backend"
    "tts": "web-speech"      // 或 "local-model"
  }
}
```

**2. 工具系统**

```typescript
// 预留接口
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (params: any) => Promise<any>;
}
```

**3. 插件系统（未来）**

允许社区开发插件：
- 自定义工具
- 自定义 TTS
- 自定义情绪检测
- 自定义 UI 主题

---

## 开发路线图

### MVP（核心功能完整版）

**目标：** 完整可用的 AI 女友应用

**功能：**
- ✅ 多 LLM API 支持
- ✅ 完整的角色管理（创建/编辑/导入/导出）
- ✅ 静态立绘 + 情绪表情
- ✅ 向量检索记忆系统
- ✅ 核心记忆管理（手动 + 自动提取）
- ✅ TTS 和语音输入
- ✅ 定时问候
- ✅ 多会话管理
- ✅ 数据导出/备份
- ✅ 统计面板
- ✅ Electron 桌面应用

### 第二阶段：增强功能

**目标：** 提升体验和可玩性

**功能：**
- 智能主动对话系统
- 工具调用（天气、搜索）
- PWA 移动端适配
- 可选本地后端服务
- 本地 TTS 模型集成
- Qdrant 向量数据库（性能优化）
- WebRTC 视频通话（实验性）

### 第三阶段：高级特性

**目标：** 差异化和社区生态

**功能：**
- Live2D 动态立绘
- 角色社区/市场
- 更多工具集成
- 插件系统
- 云同步（可选付费）
- 移动端原生应用

---

## 技术风险和挑战

### 已识别的挑战

**1. 主动对话的自然性**
- **挑战：** 判断何时主动、说什么话题
- **方案：** 分阶段实现，第一阶段简单定时，第二阶段智能判断
- **优化方向：** 收集用户反馈，调整触发逻辑

**2. 向量检索的准确性**
- **挑战：** 前端向量库性能和准确度有限
- **方案：** MVP 使用 vectra.js，第二阶段升级到 Qdrant
- **优化方向：** 优化 embedding 模型选择，调整检索策略

**3. 情绪检测的准确性**
- **挑战：** LLM 内联标注可能不准确或遗漏
- **方案：** 系统提示强调标注，提供默认 fallback
- **优化方向：** 第二阶段考虑独立情绪分类模型

**4. 跨平台一致性**
- **挑战：** Electron 和 PWA 在某些功能上差异
- **方案：** 核心功能保持一致，平台特性可选
- **优化方向：** 渐进增强策略

**5. 本地数据管理**
- **挑战：** SQLite 在浏览器中的性能限制
- **方案：** MVP 数据量可控，第二阶段优化索引
- **优化方向：** 数据分片、归档策略

---

## 开源和社区

### 开源策略

**许可证：** MIT License（待定）

**仓库结构：**
- 主仓库：核心应用代码
- 角色库：社区贡献的预设角色
- 插件库：扩展功能（第三阶段）

**社区贡献方向：**
- 预设角色创作
- 多语言翻译
- UI 主题设计
- 功能建议和 Bug 修复
- 文档改进

### 文档计划

**用户文档：**
- 快速开始指南
- 功能使用教程
- 角色卡制作教程
- 常见问题 FAQ

**开发者文档：**
- 架构设计文档（本文档）
- API 接口文档
- 插件开发指南
- 贡献指南

---

## 总结

### 项目特点

1. **开源 + 本地优先**：隐私保护，用户掌控数据
2. **模块化设计**：便于扩展和维护
3. **API 中立**：支持多种 LLM 提供商
4. **渐进式增强**：MVP 快速可用，后续持续优化
5. **社区驱动**：鼓励社区贡献角色和功能

### 核心创新点

1. **分层记忆系统**：短期 + 长期 + 核心记忆，模拟真实记忆
2. **智能主动对话**：基于上下文的自然主动交流（第二阶段）
3. **情绪驱动表情**：LLM 内联标注 + 立绘实时切换
4. **SillyTavern 兼容**：复用现有角色卡生态

### 成功指标

**技术指标：**
- 对话响应延迟 < 2 秒
- 记忆检索准确率 > 80%
- 情绪检测准确率 > 70%
- 应用启动时间 < 5 秒

**用户指标：**
- GitHub Stars > 1000（6 个月）
- 日活用户 > 500（6 个月）
- 社区贡献角色 > 50（6 个月）

---

## 附录

### 参考项目

- **SillyTavern**：角色卡格式和交互设计参考
- **Character.AI**：记忆系统和对话体验参考
- **Replika**：情感陪伴和主动对话参考

### 技术参考

- OpenAI API 文档
- Anthropic Claude API 文档
- Deepseek API 文档
- Vectra.js 文档
- SillyTavern 角色卡规范

---

**文档版本：** 1.0  
**最后更新：** 2026-06-15  
**状态：** 待审核