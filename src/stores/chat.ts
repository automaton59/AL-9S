import { create } from 'zustand';
import type { Conversation, Message, LLMService } from '../services/interfaces';
import { LLMServiceFactory } from '../services/llm';
import { useSettingsStore } from './settings';
import { buildCharacterSystemPrompt } from '../services/character';
import { loadChatHistory, loadPersistentChatHistory, saveChatHistory } from '../services/chatHistory';

let messageCounter = 0;
let conversationCounter = 0;

const generateMessageId = () => {
  return `msg_${Date.now()}_${messageCounter++}`;
};

const generateConversationId = () => {
  return `conversation_${Date.now()}_${conversationCounter++}`;
};

type PendingRequest = {
  conversationId: string;
  controller: AbortController;
  userMessageId?: string;
  mode: 'send' | 'regenerate';
};

function getActiveMessages(conversations: Conversation[], activeConversationId: string | null) {
  return conversations.find(conversation => conversation.id === activeConversationId)?.messages || [];
}

function makeConversation(characterId: string): Conversation {
  const now = new Date();

  return {
    id: generateConversationId(),
    title: '新聊天',
    characterId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getConversationTitle(messages: Message[], fallback: string) {
  const firstUserMessage = messages.find(message => message.role === 'user' && message.content.trim());

  if (!firstUserMessage) {
    return fallback;
  }

  const title = firstUserMessage.content.trim().replace(/\s+/g, ' ');
  return title.length > 22 ? `${title.slice(0, 22)}...` : title;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && error.name === 'AbortError';
}

function commitConversations(
  set: (state: Partial<ChatState>) => void,
  conversations: Conversation[],
  activeConversationId: string | null,
  extra: Partial<ChatState> = {},
) {
  saveChatHistory(conversations, activeConversationId);
  set({
    conversations,
    activeConversationId,
    messages: getActiveMessages(conversations, activeConversationId),
    ...extra,
  });
}

function updateConversationMessages(
  conversations: Conversation[],
  conversationId: string,
  updater: (messages: Message[], conversation: Conversation) => Message[],
) {
  return conversations.map(conversation => {
    if (conversation.id !== conversationId) {
      return conversation;
    }

    const messages = updater(conversation.messages, conversation);

    return {
      ...conversation,
      title: getConversationTitle(messages, conversation.title),
      messages,
      updatedAt: new Date(),
    };
  });
}

const initialChatHistory = loadChatHistory();

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  llmService: LLMService | null;
  pendingRequest: PendingRequest | null;

  hydrate: () => Promise<void>;
  initializeLLMService: () => void;
  createConversation: (characterId?: string) => string;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  retractMessage: (messageId: string) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteAfterMessage: (messageId: string) => void;
  regenerateFromMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
}

async function requestAssistantReply(
  set: (state: Partial<ChatState>) => void,
  get: () => ChatState,
  conversationId: string,
  messagesForRequest: Message[],
  pendingRequest: PendingRequest,
) {
  const settingsStore = useSettingsStore.getState();
  const service = LLMServiceFactory.create(settingsStore.llmConfig);
  const conversation = get().conversations.find(item => item.id === conversationId);
  const character = settingsStore.characters.find(item => item.id === conversation?.characterId)
    || settingsStore.characterConfig;

  set({ pendingRequest, isLoading: true, error: null });
  settingsStore.setConnectionStatus('typing');

  try {
    const response = await service.chat({
      messages: messagesForRequest,
      systemPrompt: buildCharacterSystemPrompt(character),
    }, {
      signal: pendingRequest.controller.signal,
    });

    if (get().pendingRequest?.controller !== pendingRequest.controller) {
      return;
    }

    const assistantMessage: Message = {
      id: generateMessageId(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      emotion: response.emotion,
      status: 'sent',
    };
    const conversations = updateConversationMessages(get().conversations, conversationId, messages => [
      ...messages.map(message =>
        message.id === pendingRequest.userMessageId
          ? { ...message, status: 'sent' as const }
          : message
      ),
      assistantMessage,
    ]);

    commitConversations(set, conversations, get().activeConversationId, {
      isLoading: false,
      pendingRequest: null,
    });
    await useSettingsStore.getState().markConnectionOnline();
  } catch (error) {
    if (get().pendingRequest?.controller !== pendingRequest.controller) {
      return;
    }

    if (isAbortError(error)) {
      set({ isLoading: false, pendingRequest: null });
      return;
    }

    const conversations = pendingRequest.userMessageId
      ? updateConversationMessages(get().conversations, conversationId, messages =>
        messages.map(message =>
          message.id === pendingRequest.userMessageId
            ? { ...message, status: 'failed' as const }
            : message
        ))
      : get().conversations;
    let errorMessage = '发生了未知错误';

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('401') || msg.includes('unauthorized')) {
        errorMessage = 'API Key 无效，请检查设置。';
      } else if (
        (msg.includes('404') && msg.includes('model'))
        || msg.includes('does not exist')
        || msg.includes('not support')
        || msg.includes('不支持所选模型')
      ) {
        errorMessage = '当前接口不支持这个模型。请到设置里点击“获取模型”，选择该 API 实际返回并可用于对话的模型 id。';
      } else if (msg.includes('429') || msg.includes('rate limit')) {
        errorMessage = '请求过于频繁或额度受限，请稍后再试。';
      } else if (msg.includes('network') || msg.includes('fetch failed')) {
        errorMessage = '网络错误，请检查网络、代理或 Base URL。';
      } else if (msg.includes('timeout')) {
        errorMessage = '请求超时，API 响应太慢。';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    commitConversations(set, conversations, get().activeConversationId, {
      error: errorMessage,
      isLoading: false,
      pendingRequest: null,
    });
    useSettingsStore.getState().setConnectionStatus('offline', errorMessage);
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: initialChatHistory.conversations,
  activeConversationId: initialChatHistory.activeConversationId,
  messages: getActiveMessages(initialChatHistory.conversations, initialChatHistory.activeConversationId),
  isLoading: false,
  isHydrated: false,
  error: null,
  llmService: null,
  pendingRequest: null,

  hydrate: async () => {
    const history = await loadPersistentChatHistory();
    commitConversations(set, history.conversations, history.activeConversationId, {
      isHydrated: true,
    });
  },

  initializeLLMService: () => {
    const { llmConfig } = useSettingsStore.getState();
    const service = LLMServiceFactory.create(llmConfig);
    set({ llmService: service });
  },

  createConversation: (characterId) => {
    const resolvedCharacterId = characterId || useSettingsStore.getState().activeCharacterId;
    const conversation = makeConversation(resolvedCharacterId);
    const conversations = [conversation, ...get().conversations];

    commitConversations(set, conversations, conversation.id, { error: null });
    return conversation.id;
  },

  selectConversation: (conversationId) => {
    const { conversations } = get();

    if (!conversations.some(conversation => conversation.id === conversationId)) {
      return;
    }

    commitConversations(set, conversations, conversationId, { error: null });
  },

  deleteConversation: (conversationId) => {
    const { conversations, activeConversationId, pendingRequest } = get();

    if (pendingRequest?.conversationId === conversationId) {
      pendingRequest.controller.abort();
    }

    const updatedConversations = conversations.filter(conversation => conversation.id !== conversationId);
    const nextActiveConversationId = activeConversationId === conversationId
      ? updatedConversations[0]?.id || null
      : activeConversationId;

    commitConversations(set, updatedConversations, nextActiveConversationId, {
      error: null,
      isLoading: pendingRequest?.conversationId === conversationId ? false : get().isLoading,
      pendingRequest: pendingRequest?.conversationId === conversationId ? null : pendingRequest,
    });

    if (pendingRequest?.conversationId === conversationId) {
      useSettingsStore.getState().setConnectionStatus(
        useSettingsStore.getState().isConfigured ? 'online' : 'unconfigured',
      );
    }
  },

  sendMessage: async (content: string) => {
    const state = get();

    if (state.pendingRequest) {
      return;
    }

    const settings = useSettingsStore.getState();

    if (!settings.isConfigured) {
      set({ error: '请先检查 API 设置。' });
      return;
    }

    let { conversations, activeConversationId } = state;
    let conversation = conversations.find(item => item.id === activeConversationId);

    if (!conversation) {
      conversation = makeConversation(settings.activeCharacterId);
      conversations = [conversation, ...conversations];
      activeConversationId = conversation.id;
    }

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'pending',
    };
    const nextMessages = [...conversation.messages, userMessage];
    const conversationId = conversation.id;
    const updatedConversation: Conversation = {
      ...conversation,
      title: getConversationTitle(nextMessages, conversation.title),
      messages: nextMessages,
      updatedAt: new Date(),
    };
    const nextConversations = [
      updatedConversation,
      ...conversations.filter(item => item.id !== conversationId),
    ];
    const pendingRequest: PendingRequest = {
      conversationId,
      controller: new AbortController(),
      userMessageId: userMessage.id,
      mode: 'send',
    };

    commitConversations(set, nextConversations, conversationId, {
      isLoading: true,
      error: null,
      pendingRequest,
    });
    await requestAssistantReply(set, get, conversationId, nextMessages, pendingRequest);
  },

  retractMessage: (messageId) => {
    const { pendingRequest, conversations, activeConversationId } = get();

    if (!pendingRequest || pendingRequest.userMessageId !== messageId) {
      return;
    }

    pendingRequest.controller.abort();
    const updatedConversations = updateConversationMessages(conversations, pendingRequest.conversationId, messages =>
      messages.filter(message => message.id !== messageId)
    );

    commitConversations(set, updatedConversations, activeConversationId, {
      isLoading: false,
      pendingRequest: null,
      error: null,
    });
    useSettingsStore.getState().setConnectionStatus(
      useSettingsStore.getState().isConfigured ? 'online' : 'unconfigured',
    );
  },

  updateMessage: (messageId, content) => {
    const { conversations, activeConversationId } = get();
    const updatedConversations = updateConversationMessages(conversations, activeConversationId || '', messages =>
      messages.map(message =>
        message.id === messageId
          ? { ...message, content, timestamp: new Date() }
          : message
      )
    );

    commitConversations(set, updatedConversations, activeConversationId, { error: null });
  },

  deleteAfterMessage: (messageId) => {
    const { conversations, activeConversationId, pendingRequest } = get();

    if (!activeConversationId) {
      return;
    }

    if (pendingRequest) {
      pendingRequest.controller.abort();
    }

    const updatedConversations = updateConversationMessages(conversations, activeConversationId, messages => {
      const index = messages.findIndex(message => message.id === messageId);
      return index >= 0 ? messages.slice(0, index + 1) : messages;
    });

    commitConversations(set, updatedConversations, activeConversationId, {
      isLoading: false,
      pendingRequest: null,
      error: null,
    });
    useSettingsStore.getState().setConnectionStatus(
      useSettingsStore.getState().isConfigured ? 'online' : 'unconfigured',
    );
  },

  regenerateFromMessage: async (messageId) => {
    const { conversations, activeConversationId, pendingRequest } = get();

    if (!activeConversationId || pendingRequest) {
      return;
    }

    const conversation = conversations.find(item => item.id === activeConversationId);
    const messageIndex = conversation?.messages.findIndex(message => message.id === messageId) ?? -1;

    if (!conversation || messageIndex < 0) {
      return;
    }

    const targetMessage = conversation.messages[messageIndex];
    const trimmedMessages = targetMessage.role === 'assistant'
      ? conversation.messages.slice(0, messageIndex)
      : conversation.messages.slice(0, messageIndex + 1).map(message =>
        message.id === messageId ? { ...message, status: 'sent' as const } : message
      );

    if (!trimmedMessages.some(message => message.role === 'user')) {
      return;
    }

    const updatedConversations = updateConversationMessages(conversations, activeConversationId, () => trimmedMessages);
    const request: PendingRequest = {
      conversationId: activeConversationId,
      controller: new AbortController(),
      userMessageId: targetMessage.role === 'user' ? targetMessage.id : undefined,
      mode: 'regenerate',
    };

    commitConversations(set, updatedConversations, activeConversationId, {
      isLoading: true,
      pendingRequest: request,
      error: null,
    });
    await requestAssistantReply(set, get, activeConversationId, trimmedMessages, request);
  },

  clearMessages: () => {
    const { conversations, activeConversationId, pendingRequest } = get();

    if (pendingRequest) {
      pendingRequest.controller.abort();
    }

    const updatedConversations = conversations.map(conversation =>
      conversation.id === activeConversationId
        ? { ...conversation, title: '新聊天', messages: [], updatedAt: new Date() }
        : conversation
    );

    commitConversations(set, updatedConversations, activeConversationId, {
      error: null,
      isLoading: false,
      pendingRequest: null,
    });
    useSettingsStore.getState().setConnectionStatus(
      useSettingsStore.getState().isConfigured ? 'online' : 'unconfigured',
    );
  },
}));

void useChatStore.getState().hydrate();
