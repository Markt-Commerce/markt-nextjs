import { MessageCirclePlus } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listTrendingShops } from '@/lib/api/shops';
import { safeFetch } from '@/lib/api/safe';
import { startChatAction } from './actions';
import { ShopList } from './shop-list';
import styles from './page.module.css';

export default async function StartChatPage({
  searchParams,
}: {
  searchParams: Promise<{ sellerId?: string; productId?: string; error?: string }>;
}) {
  const { sellerId, productId, error } = await searchParams;

  if (sellerId) {
    await startChatAction(sellerId, productId);
    return null;
  }

  const cookie = await getForwardedCookie();
  const shops = await safeFetch(() => listTrendingShops(cookie), []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <MessageCirclePlus size={22} /> Start a Chat
      </h1>
      <p className={styles.subtitle}>Pick a seller to message.</p>
      {error && <p style={{ color: '#b91c1c', fontSize: '0.85rem' }}>Could not start that conversation. Try again.</p>}
      <ShopList shops={shops} />
    </div>
  );
}
