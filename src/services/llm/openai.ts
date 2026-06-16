import OpenAI from 'openai';
import type { LLMService, ChatParams, ChatResponse, LLMConfig, Message } from '../interfaces';
import type { OpenAIMessage } from './types';

export class OpenAIAdapter implements LLMService {
  private client: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true, // For Electron environment
      timeout: 60000, // 60 seconds
      maxRetries: 2,
    });
  }

  private convertMessages(messages: Message[]): OpenAIMessage[] {
    return messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));
  }

  private parseEmotion(content: string): { text: string; emotion?: string } {
    const emotionRegex = /\[emotion:\s*(\w+)\]/;
    const match = content.match(emotionRegex);

    if (match) {
      return {
        text: content.replace(emotionRegex, '').trim(),
        emotion: match[1],
      };
    }

    return { text: content };
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    try {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: params.systemPrompt },
        ...this.convertMessages(params.messages),
      ];

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: params.temperature ?? this.config.temperature ?? 0.8,
        max_tokens: params.maxTokens ?? this.config.maxTokens ?? 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      const { text, emotion } = this.parseEmotion(content);

      return {
        content: text,
        emotion,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`LLM API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamChat(params: ChatParams): AsyncIterableIterator<string> {
    try {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: params.systemPrompt },
        ...this.convertMessages(params.messages),
      ];

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: params.temperature ?? this.config.temperature ?? 0.8,
        max_tokens: params.maxTokens ?? this.config.maxTokens ?? 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      throw new Error(`LLM stream call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
