import type { Conversation, Message } from './interfaces';
import { readJSONFile, writeJSONFile } from './storage';

const STORAGE_KEY = 'ai-girlfriend-chat-history';
const FILE_NAME = 'chat-history.json';

interface StoredChatHistory {
  conversations?: unknown;
  activeConversationId?: unknown;
}

function parseDate(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizeMessage(message: unknown): Message | null {
  if (typeof message !== 'object' || message === null) {
    return null;
  }

  const raw = message as Partial<Message>;
  const role = raw.role === 'assistant' || raw.role === 'system' ? raw.role : 'user';
  const content = typeof raw.content === 'string' ? raw.content : '';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `msg_${Date.now()}`,
    role,
    content,
    timestamp: parseDate(raw.timestamp),
    emotion: typeof raw.emotion === 'string' ? raw.emotion : undefined,
    reasoning: typeof raw.reasoning === 'string' && raw.reasoning.trim() ? raw.reasoning : undefined,
  };
}

function normalizeConversation(conversation: unknown): Conversation | null {
  if (typeof conversation !== 'object' || conversation === null) {
    return null;
  }

  const raw = conversation as Partial<Conversation>;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : `conversation_${Date.now()}`;
  const messages = Array.isArray(raw.messages)
    ? raw.messages.map(normalizeMessage).filter((message): message is Message => message !== null)
    : [];

  return {
    id,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : '新聊天',
    characterId: typeof raw.characterId === 'string' && raw.characterId ? raw.characterId : 'al-1s-default',
    messages,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
  };
}

export function loadChatHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { conversations: [] as Conversation[], activeConversationId: null as string | null };
    }

    const parsed = JSON.parse(stored) as StoredChatHistory;
    const conversations = Array.isArray(parsed.conversations)
      ? parsed.conversations
        .map(normalizeConversation)
        .filter((conversation): conversation is Conversation => conversation !== null)
      : [];
    const activeConversationId = typeof parsed.activeConversationId === 'string'
      && conversations.some(conversation => conversation.id === parsed.activeConversationId)
      ? parsed.activeConversationId
      : conversations[0]?.id || null;

    return { conversations, activeConversationId };
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return { conversations: [] as Conversation[], activeConversationId: null as string | null };
  }
}

export function saveChatHistory(conversations: Conversation[], activeConversationId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeConversationId }));
    void writeJSONFile(FILE_NAME, { conversations, activeConversationId });
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

export async function loadPersistentChatHistory() {
  const fileHistory = await readJSONFile<StoredChatHistory>(FILE_NAME);

  if (fileHistory) {
    const conversations = Array.isArray(fileHistory.conversations)
      ? fileHistory.conversations
        .map(normalizeConversation)
        .filter((conversation): conversation is Conversation => conversation !== null)
      : [];
    const activeConversationId = typeof fileHistory.activeConversationId === 'string'
      && conversations.some(conversation => conversation.id === fileHistory.activeConversationId)
      ? fileHistory.activeConversationId
      : conversations[0]?.id || null;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeConversationId }));
    return { conversations, activeConversationId };
  }

  const legacyHistory = loadChatHistory();
  await writeJSONFile(FILE_NAME, legacyHistory);
  return legacyHistory;
}

export async function savePersistentChatHistory(conversations: Conversation[], activeConversationId: string | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, activeConversationId }));
  await writeJSONFile(FILE_NAME, { conversations, activeConversationId });
}
