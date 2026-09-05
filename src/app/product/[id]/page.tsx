import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { redirect } from 'next/navigation';
import { ArrowUpRight, BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getSession } from '@/lib/api/session';
import { getProduct, getProductReviews, getRecommendedProducts } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { discountPercent, hasDiscount, isOutOfStock, primaryImageUrl } from '@/lib/types/product';
import { ProductCard } from '@/components/marketplace/ProductCard';
import styles from '../preview.module.css';

/** Public header + footer wrapper for the logged-out product preview. */
function ProductChrome({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Markt home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />
          </Link>
          <div className={styles.headerActions}>
            <Link href="/auth/login" className={styles.signIn}>Sign in</Link>
            <Link href="/auth/register" className={styles.signUp}>
              Create account <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/">Marketplace</Link>
          <Link href="/welcome">About Markt</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}

/**
 * Public product preview — anyone can look at an item without an account.
 * Buying, chatting, and reviewing are gated: the "add to cart" action becomes
 * a sign-up prompt that returns the visitor to the in-app product page after
 * they register. Signed-in visitors are sent to the full in-app product page.
 */
export default async function PublicProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appPath = `/app/marketplace/product/${id}`;

  const user = await getSession();
  if (user) redirect(appPath);

  const [product, reviews, recommended] = await Promise.all([
    safeFetch(() => getProduct(id), null),
    safeFetch(() => getProductReviews(id, { perPage: 6 }), {
      items: [],
      pagination: { page: 1, per_page: 6, total_items: 0, total_pages: 0 },
    }),
    safeFetch(() => getRecommendedProducts({ perPage: 5 }), []),
  ]);

  const signUpHref = `/auth/register?returnUrl=${encodeURIComponent(appPath)}`;

  if (!product) {
    return (
      <ProductChrome>
        <div className={styles.page}>
          <p className={styles.description}>This product couldn&apos;t be loaded right now. Try again shortly.</p>
          <Link href="/" className={styles.ctaGhost}>Back to marketplace</Link>
        </div>
      </ProductChrome>
    );
  }

  const imageUrl = primaryImageUrl(product) ?? '/assets/images/products/sony-headphones.png';
  const outOfStock = isOutOfStock(product);
  const stockLabel = outOfStock ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock';
  const stockClass = outOfStock ? styles.stockOut : product.stock <= 5 ? styles.stockLow : styles.stockAvailable;
  const related = recommended.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <ProductChrome>
      <div className={styles.page}>
        <nav className={styles.breadcrumb}>
          <Link href="/">Marketplace</Link> / {product.name}
        </nav>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={product.name} className={styles.galleryImage} />
          </div>

          <div>
            {product.seller && (
              <div className={styles.sellerCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.seller.profile_picture_url || '/Logo.png'} alt="" className={styles.sellerAvatar} />
                <div>
                  <p className={styles.sellerName}>
                    {product.seller.shop_name}
                    {product.seller.verification_status === 'verified' && <BadgeCheck size={14} className={styles.verifiedIcon} />}
                  </p>
                  <p className={styles.sellerMeta}>Seller on Markt</p>
                </div>
              </div>
            )}

            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.ratingRow}>
              <Star size={14} fill="currentColor" />
              <span>
                {product.average_rating.toFixed(1)} · {product.review_count} review{product.review_count === 1 ? '' : 's'} ·{' '}
                {product.view_count} views
              </span>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{formatNaira(product.price)}</span>
              {hasDiscount(product) && (
                <>
                  <span className={styles.comparePrice}>{formatNaira(product.compare_at_price!)}</span>
                  <span className={styles.discountTag}>Save {discountPercent(product)}%</span>
                </>
              )}
            </div>

            <p className={cn(styles.stockStatus, stockClass)}>{stockLabel}</p>

            {product.description && <p className={styles.description}>{product.description}</p>}

            <div className={styles.ctaCard}>
              <p className={styles.ctaTitle}>Create an account to buy</p>
              <p className={styles.ctaText}>
                Sign up to add this to your cart, message the seller, and check out securely. It only takes a minute.
              </p>
              <div className={styles.ctaRow}>
                <Link href={signUpHref} className={styles.ctaPrimary}>
                  Sign up to add to cart <ArrowUpRight size={16} />
                </Link>
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(appPath)}`} className={styles.ctaGhost}>
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>

        {reviews.items.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Reviews</h2>
            <div className={styles.reviewList}>
              {reviews.items.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHead}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={review.user?.profile_picture_url || '/Logo.png'} alt="" className={styles.reviewAvatar} />
                    <div>
                      <p className={styles.reviewerName}>{review.user?.username ?? 'Verified buyer'}</p>
                      <div className={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} fill={i < review.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && <p className={styles.reviewerName}>{review.title}</p>}
                  <p className={styles.reviewContent}>{review.content}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>You might also like</h2>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} hrefBase="/product" />
              ))}
            </div>
          </section>
        )}
      </div>
    </ProductChrome>
  );
}
