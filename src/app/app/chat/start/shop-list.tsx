import type { ShopBasic } from '@/lib/api/shops';
import { startChatAction } from './actions';
import styles from './page.module.css';

export function ShopList({ shops }: { shops: ShopBasic[] }) {
  if (shops.length === 0) {
    return <p>No sellers to show right now.</p>;
  }

  return (
    <div className={styles.list}>
      {shops.map((shop) => (
        <form key={shop.id ?? shop.shop_name} action={shop.user_id ? startChatAction.bind(null, shop.user_id, undefined) : undefined}>
          <button type="submit" className={styles.row} disabled={!shop.user_id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shop.profile_picture_url || '/Logo.png'} alt="" className={styles.avatar} />
            <div className={styles.rowBody}>
              <p className={styles.shopName}>{shop.shop_name ?? 'Shop'}</p>
              <p className={styles.shopDesc}>{shop.description}</p>
            </div>
          </button>
        </form>
      ))}
    </div>
  );
}
