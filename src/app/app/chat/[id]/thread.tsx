'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ChatMessage, ChatMessageList } from '@/lib/types/chat';
import { markReadAction, sendMessageAction } from './actions';
import styles from './page.module.css';

async function fetchMessages(roomId: number): Promise<ChatMessageList> {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages`, { cache: 'no-store' });
  if (!res.ok) return { messages: [] };
  return res.json();
}

export function Thread({
  roomId,
  currentUserId,
  initialMessages,
}: {
  roomId: number;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => fetchMessages(roomId),
    initialData: { messages: initialMessages },
    refetchInterval: 2000,
  });

  const messages = data.messages;
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    markReadAction(roomId);
  }, [roomId]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const text = content;
    setContent('');
    setError('');
    startTransition(async () => {
      const result = await sendMessageAction(roomId, text);
      if (result.error) setError(result.error);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    });
  };

  return (
    <>
      <div className={styles.messages} ref={scrollRef}>
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={cn(styles.bubbleRow, mine && styles.bubbleRowMine)}>
              <div className={cn(styles.bubble, mine && styles.bubbleMine)}>
                {message.content}
                <span className={styles.bubbleTime}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form className={styles.composer} onSubmit={onSubmit}>
        <input className={styles.input} placeholder="Type a message…" value={content} onChange={(e) => setContent(e.target.value)} />
        <button type="submit" className={styles.sendBtn} disabled={pending || !content.trim()} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
      {error && <p style={{ padding: '0 1rem', fontSize: '0.75rem', color: '#b91c1c' }}>{error}</p>}
    </>
  );
}
