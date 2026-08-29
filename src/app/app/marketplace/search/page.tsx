import { getForwardedCookie } from '@/lib/api/session';
import { listProducts } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { ProductCard } from '@/components/marketplace/ProductCard';
import styles from './page.module.css';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: query = '' } = await searchParams;
  const cookie = await getForwardedCookie();

  const results = query ? await safeFetch(() => listProducts({ search: query, perPage: 24 }, cookie), null) : null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Search results</h1>
      <p className={styles.subtitle}>
        {query ? <>Showing results for &quot;{query}&quot;</> : 'Enter a search term to find products.'}
      </p>

      {results && results.items.length === 0 && <div className={styles.emptyState}>No products found for &quot;{query}&quot;.</div>}

      {results && results.items.length > 0 && (
        <div className={styles.grid}>
          {results.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
