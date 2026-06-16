import { create } from 'zustand';
import type { Message, LLMService } from '../services/interfaces';
import { LLMServiceFactory } from '../services/llm';
import { useSettingsStore } from './settings';

let messageCounter = 0;

const generateMessageId = () => {
  return `msg_${Date.now()}_${messageCounter++}`;
};

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  llmService: LLMService | null;

  initializeLLMService: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  llmService: null,

  initializeLLMService: () => {
    const { llmConfig } = useSettingsStore.getState();
    const service = LLMServiceFactory.create(llmConfig);
    set({ llmService: service });
  },

  sendMessage: async (content: string) => {
    const { llmService, messages } = get();

    if (!llmService) {
      set({ error: 'LLM service not initialized' });
      return;
    }

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set({
      messages: [...messages, userMessage],
      isLoading: true,
      error: null,
    });

    try {
      const response = await llmService.chat({
        messages: [...messages, userMessage],
        systemPrompt: 'You are a friendly AI assistant.',
      });

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        emotion: response.emotion,
      };

      set(state => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));
