// Core message type
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: string;
}

// LLM Service
export interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  emotion?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMService {
  chat(params: ChatParams): Promise<ChatResponse>;
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

export interface AppConfig {
  llm: LLMConfig;
}
