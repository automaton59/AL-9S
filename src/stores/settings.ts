import { create } from 'zustand';
import type { LLMConfig } from '../services/interfaces';
import { ConfigService } from '../services/config';

interface SettingsState {
  llmConfig: LLMConfig;
  isConfigured: boolean;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  checkConfigured: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  llmConfig: ConfigService.load().llm,
  isConfigured: false,

  updateLLMConfig: (config) => {
    const updated = { ...get().llmConfig, ...config };
    ConfigService.updateLLM(config);
    set({ llmConfig: updated });
    get().checkConfigured();
  },

  checkConfigured: () => {
    const { llmConfig } = get();
    const configured = Boolean(llmConfig.apiKey && llmConfig.model);
    set({ isConfigured: configured });
    return configured;
  },
}));

// Initialize on load
useSettingsStore.getState().checkConfigured();
