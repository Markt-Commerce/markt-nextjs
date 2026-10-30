import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { getSession } from '@/lib/api/session';
import { listProducts } from '@/lib/api/products';
import { listCategoryTree, listCategoryProducts } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import type { ProductSearchResult } from '@/lib/types/product';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchSort, CategoryChips } from './app/marketplace/filters';
import styles from './page.module.css';

const PER_PAGE = 12;
const EMPTY_RESULTS: ProductSearchResult = {
  items: [],
  pagination: { page: 1, per_page: PER_PAGE, total_items: 0, total_pages: 0 },
};

interface HomeSearchParams {
  q?: string;
  category?: string;
  sort?: string;
  min?: string;
  max?: string;
  page?: string;
}

/**
 * The public marketplace — this is Markt's landing page. Anyone can browse the
 * product grid, search, and filter without an account. Opening a product, or
 * any buy/cart/chat action, routes through sign-in first (see ProductCard's
 * `requireAuth`). Signed-in visitors are sent straight to the full app.
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const user = await getSession();
  if (user) redirect('/app/marketplace');

  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const categoryId = sp.category ? Number(sp.category) : undefined;
  const sortBy = (sp.sort as 'newest' | 'popular' | 'price_asc' | 'price_desc' | undefined) ?? 'newest';

  const [tree, results] = await Promise.all([
    safeFetch(() => listCategoryTree(), []),
    safeFetch(
      () =>
        categoryId
          ? listCategoryProducts(categoryId, { search: sp.q, sort: sortBy, page, perPage: PER_PAGE }).then((r) => ({
              items: r.products,
              pagination: r.pagination,
            }))
          : listProducts({
              search: sp.q,
              sortBy,
              minPrice: sp.min ? Number(sp.min) : undefined,
              maxPrice: sp.max ? Number(sp.max) : undefined,
              page,
              perPage: PER_PAGE,
            }),
      EMPTY_RESULTS
    ),
  ]);

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set('q', sp.q);
    if (sp.category) params.set('category', sp.category);
    if (sp.sort) params.set('sort', sp.sort);
    params.set('page', String(targetPage));
    return `/?${params.toString()}`;
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Markt home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />
          </Link>
          <div className={styles.headerActions}>
            <ThemeToggle className={styles.iconButton} size={16} />
            <Link href="/auth/login" className={styles.signIn}>Sign in</Link>
            <Link href="/auth/register" className={styles.signUp}>
              Create account <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Shopping, the way it connects us</p>
        <h1 className={styles.heroTitle}>
          Discover from <em>local sellers</em> near you
        </h1>
        <p className={styles.heroSub}>
          Browse freely, no sign-up required. Create an account when you&apos;re ready to buy, chat with a seller, or save a find.
        </p>
      </section>

      <div className={styles.body}>
        <div className={styles.toolbar}>
          <SearchSort />
        </div>

        <CategoryChips categories={tree} />

        <div className={styles.resultsBar}>
          <h2 className={styles.sectionTitle}>
            {sp.q ? `Results for “${sp.q}”` : categoryId ? 'In this category' : 'Fresh finds'}
          </h2>
          {results.pagination.total_items > 0 && (
            <span className={styles.resultCount}>
              {results.pagination.total_items} item{results.pagination.total_items === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {results.items.length === 0 ? (
          <div className={styles.emptyState}>
            Nothing here yet. Try a different search, or{' '}
            <Link href="/auth/register">create an account</Link> to ask sellers directly.
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {results.items.map((product) => (
                <ProductCard key={product.id} product={product} hrefBase="/product" />
              ))}
            </div>

            {results.pagination.total_pages > 1 && (
              <div className={styles.pagination}>
                {page > 1 ? (
                  <Link href={buildHref(page - 1)} className={styles.pageBtn}>Previous</Link>
                ) : (
                  <span className={styles.pageBtnDisabled}>Previous</span>
                )}
                <span className={styles.pageInfo}>
                  Page {results.pagination.page} of {results.pagination.total_pages}
                </span>
                {page < results.pagination.total_pages ? (
                  <Link href={buildHref(page + 1)} className={styles.pageBtn}>Next</Link>
                ) : (
                  <span className={styles.pageBtnDisabled}>Next</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className={styles.footer}>
        <p>Shopping, the way it connects us.</p>
        <div className={styles.footerLinks}>
          <Link href="/welcome">About Markt</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/auth/register">Start selling</Link>
        </div>
      </footer>
    </main>
  );
}
