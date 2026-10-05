import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getMarket, getMarketProducts } from '@/lib/api/markets';
import { safeFetch } from '@/lib/api/safe';
import { ProductCard } from '@/components/marketplace/ProductCard';
import styles from '../markets.module.css';

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession(`/app/markets/${id}`);
  const cookie = await getForwardedCookie();

  const market = await safeFetch(() => getMarket(id, cookie), null);
  if (!market) {
    return (
      <div className={styles.page}>
        <Link href="/app/markets" className={styles.breadcrumb}>
          <ArrowLeft size={15} /> Markets
        </Link>
        <div className={styles.emptyState}>This market couldn&apos;t be loaded right now.</div>
      </div>
    );
  }

  const products = await safeFetch(() => getMarketProducts(id, cookie, { perPage: 24 }), {
    items: [],
    pagination: { page: 1, per_page: 24, total_items: 0, total_pages: 0 },
  });

  return (
    <div className={styles.page}>
      <Link href="/app/markets" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Markets
      </Link>

      <div className={styles.detailHead}>
        <span className={styles.cardIcon}>
          <Store size={22} />
        </span>
        <div>
          <h1 className={styles.detailName}>{market.name}</h1>
          <span className={styles.detailMeta}>
            {market.seller_count.toLocaleString('en-NG')} seller{market.seller_count === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Products</h2>
      {products.items.length === 0 ? (
        <div className={styles.emptyState} style={{ marginTop: '1.25rem' }}>
          No products listed in this market yet.
        </div>
      ) : (
        <div className={styles.productGrid}>
          {products.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
