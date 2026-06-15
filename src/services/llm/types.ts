import type { LLMConfig, ChatParams, ChatResponse, LLMService } from '../interfaces';

export type { LLMConfig, ChatParams, ChatResponse, LLMService };

// OpenAI-specific types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
