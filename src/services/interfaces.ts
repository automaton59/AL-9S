// Core message type
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: string;
  reasoning?: string;
  status?: 'pending' | 'sent' | 'failed';
}

export interface Conversation {
  id: string;
  title: string;
  characterId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// LLM Service
export interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCallOptions {
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  emotion?: string;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMService {
  chat(params: ChatParams, options?: LLMCallOptions): Promise<ChatResponse>;
  streamChat(params: ChatParams): AsyncIterableIterator<string>;
}

// Configuration types
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
  apiKey: string;
  model: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMModelInfo {
  id: string;
  name?: string;
  ownedBy?: string;
}

export type APIKeyEncoding = 'safe:v1' | 'plain:fallback';

export interface APIProfile {
  id: string;
  name: string;
  provider: LLMConfig['provider'];
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  encryptedApiKey: string;
  keyEncoding: APIKeyEncoding;
  lastConnectedAt?: string;
}

export type ConnectionStatus = 'unconfigured' | 'checking' | 'online' | 'offline' | 'typing';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface CharacterConfig {
  id: string;
  name: string;
  description: string;
  scenario: string;
  firstMessage: string;
  systemPrompt: string;
}

export interface AppConfig {
  llm: LLMConfig;
  characters: CharacterConfig[];
  activeCharacterId: string;
  activeProfileId?: string | null;
  themeMode: ThemeMode;
}
