# AL-1S AI 女友项目 🤖💕

一个开源的 AI 陪伴应用，使用 React + TypeScript + Electron 构建。

## 📖 项目简介

AL-1S 是一个本地优先、隐私保护的 AI 女友应用。通过自然的对话交互，提供情感陪伴体验。

**核心特点：**
- 🔒 **本地优先**：数据存储在你的电脑上，隐私完全掌控
- 🎨 **多 LLM 支持**：可使用 OpenAI、Deepseek、或任何 OpenAI 兼容的 API
- 😊 **情绪感知**：AI 会表达情绪（开心、难过、害羞等）
- 💾 **配置持久化**：设置自动保存，无需重复配置
- 🖥️ **跨平台**：支持 Windows、macOS、Linux

## 🚀 快速开始

### 前置要求

- **Node.js 18+**（[下载地址](https://nodejs.org/)）
- **npm**（Node.js 自带）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/automaton59/AL-9S.git
cd AL-9S
```

#### 2. 安装依赖

```bash
npm install
```

> ⏱️ 首次安装需要 3-5 分钟，请耐心等待。

#### 3. 启动应用

**方式 A：Web 开发模式（推荐调试）**

```bash
npm run dev
```

然后在浏览器打开：http://localhost:5173

**方式 B：Electron 桌面应用（推荐使用）**

```bash
npm start
```

会自动编译并启动 Electron 桌面应用。

## ⚙️ 配置使用

### 第一次使用

1. **启动应用后，会自动跳转到「设置」标签页**

2. **选择 LLM 提供商：**
   - **OpenAI**：需要 OpenAI API Key
   - **Deepseek**：需要 Deepseek API Key（推荐，更便宜）
   - **自定义**：任何兼容 OpenAI 格式的 API

3. **填写配置信息：**

#### 选项 A：使用 OpenAI

```
提供商：OpenAI
API Key：sk-proj-xxxxxx（在 https://platform.openai.com/api-keys 获取）
模型：gpt-4o-mini
```

#### 选项 B：使用 Deepseek（推荐）

```
提供商：Deepseek
API Key：sk-xxxxxx（在 https://platform.deepseek.com 注册获取）
模型：deepseek-chat
Base URL：https://api.deepseek.com
```

#### 选项 C：使用自定义 API

```
提供商：Custom (OpenAI-compatible)
API Key：你的 API Key
模型：你的模型名称
Base URL：你的 API 地址
```

4. **点击「Save Settings」保存**

5. **切换到「Chat」标签页，开始聊天！** 🎉

### 常见问题

**Q: 我没有 API Key 怎么办？**

A: 你需要注册一个 LLM 服务提供商账号：
- **OpenAI**：https://platform.openai.com （需要信用卡，$5 起充值）
- **Deepseek**：https://platform.deepseek.com （支持支付宝，更便宜）

**Q: API 调用收费吗？**

A: 是的，LLM API 按 token 使用量计费。Deepseek 大约 ¥1 可以聊几千轮对话。

**Q: 数据存储在哪里？**

A: 配置存储在浏览器的 localStorage，聊天记录目前仅在内存（Phase 2 会添加数据库）。

**Q: 如何清空配置重新设置？**

A: 
- 浏览器：打开开发者工具（F12） → Application → Local Storage → 删除 `ai-girlfriend-config`
- Electron：清空配置后重启应用

**Q: 应用卡住或报错怎么办？**

A: 
1. 检查 API Key 是否正确
2. 检查网络连接
3. 查看浏览器控制台（F12）的错误信息
4. 重启应用

## 🎮 使用技巧

### 对话技巧

- **普通对话**：直接输入文字，按回车发送
- **查看情绪**：AI 回复下方会显示当前情绪（如果有）
- **等待响应**：发送后会显示跳动的加载动画

### 快捷键

- **Enter**：发送消息
- **Shift + Enter**：换行（暂未实现，当前仅支持单行）

## 📁 项目结构

```
AL-1S/
├── electron/              # Electron 桌面应用
│   ├── main.ts           # 主进程
│   └── preload.ts        # 预加载脚本
├── src/
│   ├── components/       # React 组件
│   │   ├── Chat/        # 聊天界面
│   │   └── Settings/    # 设置界面
│   ├── services/        # 服务层（核心抽象）
│   │   ├── interfaces.ts # 接口定义
│   │   ├── llm/         # LLM 适配器
│   │   └── config/      # 配置管理
│   ├── stores/          # 状态管理
│   └── App.tsx          # 主应用
├── docs/                # 文档
├── package.json         # 依赖配置
└── README.md           # 本文档
```

## 🛠️ 开发相关

### 可用命令

```bash
# 开发模式（Vite 热重载）
npm run dev

# 构建生产版本
npm run build

# 启动 Electron 应用
npm start

# 编译 Electron 代码
npm run electron:compile

# 打包为可执行文件
npm run electron:build
```

### 技术栈

- **前端**：React 18 + TypeScript 5.7
- **构建**：Vite 6
- **桌面**：Electron 33
- **状态管理**：Zustand 4.5
- **样式**：TailwindCSS 3.4
- **LLM SDK**：OpenAI SDK 4.77

## 📅 开发路线

- ✅ **Phase 1（已完成）**：项目基础 + 基础聊天
  - 多 LLM API 支持
  - 聊天界面
  - 情绪检测
  - 配置管理

- 🚧 **Phase 2（计划中）**：记忆系统
  - SQLite 数据库
  - 对话历史存储
  - 向量检索（长期记忆）
  - 核心记忆管理

- 📋 **Phase 3（计划中）**：角色管理
  - 自定义角色
  - SillyTavern 角色卡兼容
  - 多角色切换

- 🎨 **Phase 4（计划中）**：表情 + 语音
  - 立绘显示
  - 表情切换
  - TTS 语音合成
  - 语音输入

- 🌟 **Phase 5（计划中）**：完善功能
  - 主动对话
  - 统计面板
  - 数据导出/导入

## 🤝 贡献指南

欢迎贡献代码、报告 Bug、提出建议！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- OpenAI - GPT 模型
- Deepseek - 高性价比 LLM 服务
- SillyTavern - 角色卡格式参考

---

**如有问题，请提交 Issue：** https://github.com/automaton59/AL-9S/issues

**祝你聊得开心！** 💕✨
