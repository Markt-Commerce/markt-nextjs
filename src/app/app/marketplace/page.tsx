import Link from 'next/link';
import { ArrowUpRight, Clipboard, MapPin, Users } from 'lucide-react';
import { getForwardedCookie, getSession } from '@/lib/api/session';
import type { Address } from '@/lib/types/user';
import { listProducts } from '@/lib/api/products';
import { listCategoryTree, listCategoryProducts } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import type { ProductSearchResult } from '@/lib/types/product';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { CategoryChips, SearchSort } from './filters';
import styles from './page.module.css';

const PER_PAGE = 12;
const EMPTY_RESULTS: ProductSearchResult = {
  items: [],
  pagination: { page: 1, per_page: PER_PAGE, total_items: 0, total_pages: 0 },
};

// "Saved" means the address has real location content, not just an empty
// object the backend may return.
function hasSavedAddress(address?: Address): boolean {
  return !!(address && (address.street || address.city || address.postal_code));
}

interface MarketplaceSearchParams {
  q?: string;
  category?: string;
  sort?: string;
  min?: string;
  max?: string;
  page?: string;
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<MarketplaceSearchParams> }) {
  const sp = await searchParams;
  const cookie = await getForwardedCookie();
  const page = Number(sp.page) || 1;
  const categoryId = sp.category ? Number(sp.category) : undefined;
  const sortBy = (sp.sort as 'newest' | 'popular' | 'price_asc' | 'price_desc' | undefined) ?? 'newest';
  const isBrowsing = !sp.q && !sp.category && page === 1;

  // Free (React cache()-memoized) — the app shell already loaded the session
  // this request. Once an address is on file, the "set your area" prompt has
  // done its job and is dropped.
  const user = await getSession();
  const showAreaTile = !hasSavedAddress(user?.address);

  const [tree, results] = await Promise.all([
    safeFetch(() => listCategoryTree(), []),
    safeFetch(
      () =>
        categoryId
          ? listCategoryProducts(categoryId, { search: sp.q, sort: sortBy, page, perPage: PER_PAGE }, cookie).then((r) => ({
              items: r.products,
              pagination: r.pagination,
            }))
          : listProducts(
              {
                search: sp.q,
                sortBy,
                minPrice: sp.min ? Number(sp.min) : undefined,
                maxPrice: sp.max ? Number(sp.max) : undefined,
                page,
                perPage: PER_PAGE,
              },
              cookie
            ),
      EMPTY_RESULTS
    ),
  ]);

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.category) params.set('category', sp.category);
    if (sp.sort) params.set('sort', sp.sort);
    params.set('page', String(targetPage));
    return `/app/marketplace?${params.toString()}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Explore</h1>
        <SearchSort />
      </header>

      <CategoryChips categories={tree} />

      {/* Editorial tiles only lead the page when you're browsing — once
          you've searched or filtered, results take over immediately. */}
      {isBrowsing && (
        <div className={styles.bento}>
          <Link href="/app/requests/create" className={`${styles.tile} ${styles.tileButter} ${styles.spanWide}`}>
            <div>
              <p className={styles.tileEyebrow}>Can&apos;t find it?</p>
              <h2 className={styles.tileTitle}>Ask, and sellers come to you</h2>
              <p className={styles.tileCopy}>
                Post what you&apos;re looking for. Nearby sellers reply with offers and prices.
              </p>
            </div>
            <span className={styles.tileAction}>
              <Clipboard size={13} /> Post a request
            </span>
            <ArrowUpRight size={20} className={styles.tileCorner} />
          </Link>

          {/* When the area tile is gone, the feed tile widens so the row
              stays balanced rather than leaving a gap. */}
          <Link href="/app/community/social-feed" className={`${styles.tile} ${styles.tileMint} ${showAreaTile ? '' : styles.spanWide}`}>
            <div>
              <p className={styles.tileEyebrow}>Community</p>
              <h2 className={styles.tileTitle}>Shop the feed</h2>
              <p className={styles.tileCopy}>See what people near you are finding.</p>
            </div>
            <span className={styles.tileAction}>
              <Users size={13} /> Open feed
            </span>
            <ArrowUpRight size={20} className={styles.tileCorner} />
          </Link>

          {showAreaTile && (
            <Link href="/app/settings" className={`${styles.tile} ${styles.tileSky}`}>
              <div>
                <p className={styles.tileEyebrow}>Local</p>
                <h2 className={styles.tileTitle}>Set your area</h2>
                <p className={styles.tileCopy}>Get results from sellers close to you.</p>
              </div>
              <span className={styles.tileAction}>
                <MapPin size={13} /> Add address
              </span>
              <ArrowUpRight size={20} className={styles.tileCorner} />
            </Link>
          )}
        </div>
      )}

      <div className={styles.resultsBar}>
        <h2 className={styles.sectionTitle}>{sp.q ? `Results for “${sp.q}”` : categoryId ? 'In this category' : 'Fresh finds'}</h2>
        {results.pagination.total_items > 0 && (
          <span className={styles.resultCount}>
            {results.pagination.total_items} item{results.pagination.total_items === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {results.items.length === 0 ? (
        <div className={styles.emptyState}>
          Nothing here yet. Try a different search — or{' '}
          <Link href="/app/requests/create">ask sellers directly</Link>.
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {results.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {results.pagination.total_pages > 1 && (
            <div className={styles.pagination}>
              {page > 1 ? (
                <Link href={buildHref(page - 1)} className={styles.pageBtn}>
                  Previous
                </Link>
              ) : (
                <span className={styles.pageBtnDisabled}>Previous</span>
              )}
              <span className={styles.pageInfo}>
                Page {results.pagination.page} of {results.pagination.total_pages}
              </span>
              {page < results.pagination.total_pages ? (
                <Link href={buildHref(page + 1)} className={styles.pageBtn}>
                  Next
                </Link>
              ) : (
                <span className={styles.pageBtnDisabled}>Next</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
