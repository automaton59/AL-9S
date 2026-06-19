import { useEffect } from 'react';
import { MessageCirclePlus, Settings, Trash2 } from 'lucide-react';
import { useChatStore } from '../../stores/chat';
import { useSettingsStore } from '../../stores/settings';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';
import { CharacterCard } from '../Character/CharacterCard';
import { SelectMenu } from '../UI/SelectMenu';
import type { CharacterConfig, Conversation } from '../../services/interfaces';

interface ChatWindowProps {
  onEditCharacter?: () => void;
}

function formatConversationTime(conversation: Conversation) {
  return conversation.updatedAt.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCharacter(characters: CharacterConfig[], characterId: string | undefined, fallback: CharacterConfig) {
  return characters.find(character => character.id === characterId) || fallback;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'typing':
      return '正在输入...';
    case 'online':
      return '在线';
    case 'checking':
      return '正在连接';
    case 'offline':
      return '离线';
    default:
      return '未配置';
  }
}

function getStatusDot(status: string) {
  if (status === 'typing' || status === 'online') {
    return 'bg-emerald-400';
  }

  if (status === 'checking') {
    return 'bg-amber-400';
  }

  return 'bg-slate-300';
}

export function ChatWindow({ onEditCharacter }: ChatWindowProps) {
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    error,
    sendMessage,
    retractMessage,
    updateMessage,
    deleteAfterMessage,
    regenerateFromMessage,
    initializeLLMService,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useChatStore();
  const {
    isConfigured,
    llmConfig,
    activeProfileId,
    characters,
    activeCharacterId,
    characterConfig,
    connectionStatus,
    setActiveCharacter,
    checkConnection,
  } = useSettingsStore();
  const activeConversation = conversations.find(conversation => conversation.id === activeConversationId);
  const currentCharacter = getCharacter(characters, activeConversation?.characterId, characterConfig);

  useEffect(() => {
    if (isConfigured) {
      initializeLLMService();
    }
  }, [isConfigured, llmConfig, initializeLLMService]);

  useEffect(() => {
    if (isConfigured) {
      void checkConnection();
    }
  }, [activeProfileId, checkConnection, isConfigured]);

  const handleNewConversation = () => {
    createConversation(activeCharacterId);
  };

  const handleCharacterChange = (characterId: string) => {
    setActiveCharacter(characterId);

    const reusableConversation = conversations.find(conversation =>
      conversation.characterId === characterId && conversation.messages.length === 0
    );

    if (reusableConversation) {
      selectConversation(reusableConversation.id);
      return;
    }

    createConversation(characterId);
  };

  return (
    <div className="flex h-full min-h-0 bg-[radial-gradient(circle_at_top_left,#ffe4e6_0,#fff7ed_34%,#f8fafc_82%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,#3a1728_0,#1b1018_34%,#0d1118_82%)] dark:text-rose-50">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-white/70 bg-white/55 backdrop-blur dark:border-white/10 dark:bg-[#171018]/70 md:flex">
        <div className="shrink-0 space-y-3 border-b border-white/70 p-4 dark:border-white/10">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">角色</span>
            <SelectMenu
              value={currentCharacter.id}
              onChange={handleCharacterChange}
              buttonClassName="h-10 text-sm"
              options={characters.map(character => ({
                value: character.id,
                label: character.name,
              }))}
            />
          </label>
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 text-sm font-medium text-white shadow-sm shadow-rose-200 hover:bg-rose-600 dark:bg-rose-400 dark:text-[#1b1018] dark:shadow-none dark:hover:bg-rose-300"
          >
            <MessageCirclePlus size={17} />
            新聊天
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 px-1 text-xs font-medium text-slate-500 dark:text-slate-400">聊天记录</div>
          <div className="grid gap-2">
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rose-100 bg-white/60 px-3 py-4 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                还没有聊天
              </div>
            ) : (
              conversations.map(conversation => {
                const character = getCharacter(characters, conversation.characterId, characterConfig);
                const isActive = conversation.id === activeConversationId;

                return (
                  <div
                    key={conversation.id}
                    className={`rounded-2xl border bg-white/80 shadow-sm transition dark:bg-white/5 dark:shadow-none ${isActive ? 'border-rose-200 ring-2 ring-rose-100 dark:border-rose-300/40 dark:ring-rose-300/10' : 'border-white/80 hover:border-rose-100 dark:border-white/10 dark:hover:border-rose-300/30'}`}
                  >
                    <button
                      type="button"
                      onClick={() => selectConversation(conversation.id)}
                      className="block w-full px-3 py-2.5 text-left"
                    >
                      <div className="truncate text-sm font-medium text-slate-950 dark:text-rose-50">{conversation.title}</div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate">{character.name}</span>
                        <span className="shrink-0">{formatConversationTime(conversation)}</span>
                      </div>
                    </button>
                    <div className="flex items-center justify-between border-t border-rose-50 px-3 py-1.5 text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
                      <span>{conversation.messages.length} 条消息</span>
                      <button
                        type="button"
                        onClick={() => deleteConversation(conversation.id)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-red-500 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={12} />
                        删除
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="max-h-72 shrink-0 overflow-y-auto border-t border-white/70 dark:border-white/10">
          <CharacterCard character={currentCharacter} onEdit={onEditCharacter} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-white/70 bg-white/60 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#171018]/65">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-fuchsia-400 text-lg font-semibold text-white shadow-sm shadow-rose-200 dark:from-rose-300 dark:to-fuchsia-300 dark:text-[#1b1018] dark:shadow-none">
                {currentCharacter.name.slice(0, 1).toUpperCase()}
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#171018] ${getStatusDot(connectionStatus)}`} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-slate-950 dark:text-rose-50">{currentCharacter.name}</h1>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{getStatusLabel(connectionStatus)}</p>
              </div>
            </div>
            {onEditCharacter && (
              <button
                type="button"
                onClick={onEditCharacter}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-rose-50 dark:border-white/10 dark:bg-white/5 dark:text-rose-100 dark:hover:bg-white/10"
              >
                <Settings size={15} />
                角色卡
              </button>
            )}
          </div>

          <div className="mt-3 grid gap-2 md:hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <SelectMenu
                className="min-w-0"
                value={currentCharacter.id}
                onChange={handleCharacterChange}
                buttonClassName="h-10 text-sm"
                options={characters.map(character => ({
                  value: character.id,
                  label: character.name,
                }))}
              />
              <button
                type="button"
                onClick={handleNewConversation}
                className="h-10 rounded-xl bg-rose-500 px-3 text-sm font-medium text-white hover:bg-rose-600 dark:bg-rose-400 dark:text-[#1b1018] dark:hover:bg-rose-300"
              >
                新聊天
              </button>
            </div>

            <SelectMenu
              value={activeConversationId || ''}
              onChange={selectConversation}
              disabled={conversations.length === 0}
              buttonClassName="h-10 text-sm"
              options={conversations.length === 0
                ? [{ value: '', label: '还没有聊天', disabled: true }]
                : conversations.map(conversation => ({
                  value: conversation.id,
                  label: conversation.title,
                  description: formatConversationTime(conversation),
                }))}
            />
          </div>
        </div>

        {error && (
          <div className="shrink-0 border-l-4 border-red-400 bg-red-50/90 p-4 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <MessageList
          messages={messages}
          firstMessage={currentCharacter.firstMessage}
          onEditMessage={updateMessage}
          onRetractMessage={retractMessage}
          onRegenerateMessage={(messageId) => void regenerateFromMessage(messageId)}
          onDeleteAfterMessage={deleteAfterMessage}
        />

        <InputBar onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
