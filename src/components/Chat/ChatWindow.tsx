import { useEffect } from 'react';
import { useChatStore } from '../../stores/chat';
import { useSettingsStore } from '../../stores/settings';
import { MessageList } from './MessageList';
import { InputBar } from './InputBar';

export function ChatWindow() {
  const { messages, isLoading, error, sendMessage, initializeLLMService } = useChatStore();
  const { isConfigured, llmConfig } = useSettingsStore();

  useEffect(() => {
    if (isConfigured) {
      initializeLLMService();
    }
  }, [isConfigured, llmConfig, initializeLLMService]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
