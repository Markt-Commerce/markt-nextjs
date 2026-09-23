import Link from 'next/link';
import { Heart } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { getForwardedCookie } from '@/lib/api/session';
import { listSavedProducts } from '@/lib/api/saved';
import { UnsaveButton } from './unsave-button';
import styles from './page.module.css';

export default async function FavoritesPage() {
  const cookie = await getForwardedCookie();
  const items = await listSavedProducts(cookie);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <Heart size={22} /> Saved Items
      </h1>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          Nothing saved yet. <Link href="/app/marketplace">Browse the marketplace</Link> and tap the heart on anything you like.
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.content_id} className={styles.card}>
              <UnsaveButton productId={item.content_id} />
              <Link href={`/app/marketplace/product/${item.content_id}`} className={styles.cardLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url ?? '/assets/images/products/sony-headphones.png'}
                  alt={item.title ?? 'Saved product'}
                  className={styles.image}
                />
                <div className={styles.body}>
                  <p className={styles.name}>{item.title ?? 'Product'}</p>
                  {item.price != null && <p className={styles.price}>{formatNaira(item.price)}</p>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
