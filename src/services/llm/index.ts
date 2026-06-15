import type { LLMService, LLMConfig } from '../interfaces';
import { OpenAIAdapter } from './openai';

export class LLMServiceFactory {
  static create(config: LLMConfig): LLMService {
    switch (config.provider) {
      case 'openai':
      case 'deepseek':
      case 'custom':
        // All use OpenAI-compatible API
        return new OpenAIAdapter(config);
      case 'anthropic':
        throw new Error('Anthropic adapter not yet implemented');
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }
}

export { OpenAIAdapter };
export type { LLMService, LLMConfig } from '../interfaces';
