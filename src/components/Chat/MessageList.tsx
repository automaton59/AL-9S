import { useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '../../services/interfaces';

interface MessageListProps {
  messages: Message[];
  firstMessage?: string;
  onEditMessage?: (messageId: string, content: string) => void;
  onRetractMessage?: (messageId: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
  onDeleteAfterMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  firstMessage,
  onEditMessage,
  onRetractMessage,
  onRegenerateMessage,
  onDeleteAfterMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsUserScrolling(!isAtBottom);
    }
  };

  useEffect(() => {
    if (scrollRef.current && !isUserScrolling) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isUserScrolling]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
    >
      {messages.length === 0 ? (
        <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-white/80 bg-white/80 px-5 py-4 text-center text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:shadow-none">
          {firstMessage || '还没有消息'}
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onEdit={onEditMessage}
            onRetract={onRetractMessage}
            onRegenerate={onRegenerateMessage}
            onDeleteAfter={onDeleteAfterMessage}
          />
        ))
      )}
    </div>
  );
}
