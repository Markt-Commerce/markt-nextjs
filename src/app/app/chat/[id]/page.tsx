import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { listChatRooms, listMessages } from '@/lib/api/chat';
import { safeFetch } from '@/lib/api/safe';
import { Thread } from './thread';
import styles from './page.module.css';

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = Number(id);
  const cookie = await getForwardedCookie();
  const user = await requireSession();

  const [roomsData, messagesData] = await Promise.all([
    safeFetch(() => listChatRooms(cookie), { rooms: [] }),
    safeFetch(() => listMessages(roomId, cookie), { messages: [] }),
  ]);

  const room = roomsData.rooms.find((r) => r.id === roomId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/app/chat" className={styles.backLink} aria-label="Back to messages">
          <ArrowLeft size={20} />
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={room?.other_user.profile_picture ?? '/Logo.png'} alt="" className={styles.avatar} />
        <div className={styles.headerBody}>
          <p className={styles.username}>{room?.other_user.username ?? 'Conversation'}</p>
          {room?.product && (
            <Link href={`/app/marketplace/product/${room.product.id}`} className={styles.productTag}>
              Re: {room.product.name}
            </Link>
          )}
        </div>
      </header>

      <Thread roomId={roomId} currentUserId={user.id} initialMessages={messagesData.messages} />
    </div>
  );
}
