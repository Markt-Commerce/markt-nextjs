import Link from 'next/link';
import { MessageCircle, Plus } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listChatRooms } from '@/lib/api/chat';
import { safeFetch } from '@/lib/api/safe';
import { cn } from '@/lib/cn';
import styles from './page.module.css';

export default async function ChatOverviewPage() {
  const cookie = await getForwardedCookie();
  const data = await safeFetch(() => listChatRooms(cookie), { rooms: [] });

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>
          <MessageCircle size={22} /> Messages
        </h1>
        <Link href="/app/chat/start" className={styles.newChatBtn}>
          <Plus size={14} /> New Chat
        </Link>
      </div>

      {data.rooms.length === 0 && (
        <div className={styles.emptyState}>
          No conversations yet. <Link href="/app/chat/start">Start a chat</Link> with a seller.
        </div>
      )}

      {data.rooms.length > 0 && (
        <div className={styles.list}>
          {data.rooms.map((room) => (
            <Link key={room.id} href={`/app/chat/${room.id}`} className={styles.row}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={room.other_user.profile_picture ?? '/Logo.png'} alt="" className={styles.avatar} />
              <div className={styles.rowBody}>
                <div className={styles.rowHead}>
                  <span className={styles.username}>{room.other_user.username}</span>
                  {room.last_message_at && <span className={styles.time}>{new Date(room.last_message_at).toLocaleDateString()}</span>}
                </div>
                <p className={cn(styles.preview, room.unread_count > 0 && styles.previewUnread)}>
                  {room.last_message?.content ?? 'No messages yet'}
                </p>
                {room.product && <p className={styles.productTag}>Re: {room.product.name}</p>}
              </div>
              {room.unread_count > 0 && <span className={styles.unreadBadge}>{room.unread_count}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
