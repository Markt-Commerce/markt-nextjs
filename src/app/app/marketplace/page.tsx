import Link from 'next/link';
import { Store } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { listProducts } from '@/lib/api/products';
import { listCategoryTree, listCategoryProducts } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import type { ProductSearchResult } from '@/lib/types/product';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { SearchSort } from './search-sort';
import { SidebarFilters } from './sidebar-filters';
import styles from './page.module.css';

const PER_PAGE = 8;
const EMPTY_RESULTS: ProductSearchResult = { items: [], pagination: { page: 1, per_page: PER_PAGE, total_items: 0, total_pages: 0 } };

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
    if (sp.min) params.set('min', sp.min);
    if (sp.max) params.set('max', sp.max);
    params.set('page', String(targetPage));
    return `/app/marketplace?${params.toString()}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>
            <Store size={22} /> Marketplace
          </h1>
          <SearchSort />
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <SidebarFilters categories={tree} />
        </aside>

        <main className={styles.content}>
          <div className={styles.resultsBar}>
            <span>
              {results.pagination.total_items} result{results.pagination.total_items === 1 ? '' : 's'}
            </span>
          </div>

          {results.items.length === 0 && <div className={styles.emptyState}>No products match your filters.</div>}

          {results.items.length > 0 && (
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
                  <span>
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
        </main>
      </div>
    </div>
  );
}
