# AI Girlfriend

An open-source AI companion application built with React, TypeScript, and Electron.

## Features (Phase 1)

- ✅ Multi-LLM API support (OpenAI, Deepseek, custom endpoints)
- ✅ Real-time chat interface
- ✅ Emotion detection from AI responses
- ✅ Local configuration storage
- ✅ Cross-platform desktop app (Electron)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd ai-girlfriend
```

2. Install dependencies
```bash
npm install
```

3. Run in development mode
```bash
npm run dev
```

4. Or run as Electron app
```bash
npm run electron:compile
npm run electron:dev
```

### Configuration

1. Open the Settings tab
2. Select your LLM provider (OpenAI, Deepseek, or Custom)
3. Enter your API key
4. Enter the model name (e.g., `gpt-4o-mini` or `deepseek-chat`)
5. For Deepseek or custom providers, set the Base URL
6. Click "Save Settings"
7. Switch to Chat tab and start chatting!

## Development

### Project Structure

```
src/
├── components/       # React components
│   ├── Chat/        # Chat UI
│   └── Settings/    # Settings UI
├── services/        # Service layer
│   ├── interfaces.ts # Service contracts
│   ├── llm/         # LLM adapters
│   └── config/      # Configuration management
└── stores/          # Zustand state management
```

### Tech Stack

- React 18
- TypeScript 5.7
- Electron 33
- Vite 6
- Zustand (state management)
- TailwindCSS (styling)
- OpenAI SDK

## Roadmap

- **Phase 1** (Current): Foundation + Basic Chat ✅
- **Phase 2**: Memory System (SQLite + Vector Search)
- **Phase 3**: Character Management (SillyTavern compatible)
- **Phase 4**: Emotions + TTS
- **Phase 5**: Polish + Additional Features

## License

MIT
