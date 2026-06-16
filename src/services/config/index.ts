import type { AppConfig, LLMConfig } from '../interfaces';

const DEFAULT_CONFIG: AppConfig = {
  llm: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 2000,
  },
};

export class ConfigService {
  private static readonly STORAGE_KEY = 'ai-girlfriend-config';

  static load(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          llm: { ...DEFAULT_CONFIG.llm, ...(parsed.llm || {}) }
        };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return DEFAULT_CONFIG;
  }

  static save(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  static updateLLM(llmConfig: Partial<LLMConfig>): void {
    const config = this.load();
    config.llm = { ...config.llm, ...llmConfig };
    this.save(config);
  }
}
