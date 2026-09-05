import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiFetch } from '@/lib/api/client';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getProduct, getProductReviews, getRecommendedProducts } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { discountPercent, hasDiscount, isOutOfStock, primaryImageUrl } from '@/lib/types/product';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PurchaseActions } from './purchase-actions';
import { ReviewForm } from './review-form';
import styles from './page.module.css';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = await getForwardedCookie();
  // Already checked once by app/layout.tsx's requireSession() — this call
  // is free (React cache()-memoized per request), just gives us the role.
  const user = await requireSession();

  const [product, reviews, recommended] = await Promise.all([
    safeFetch(() => getProduct(id, cookie), null),
    safeFetch(() => getProductReviews(id, { perPage: 10 }, cookie), { items: [], pagination: { page: 1, per_page: 10, total_items: 0, total_pages: 0 } }),
    safeFetch(() => getRecommendedProducts({ perPage: 5 }, cookie), []),
    apiFetch(`/products/${encodeURIComponent(id)}/view`, { method: 'POST', cookie }).catch(() => undefined),
  ]);

  if (!product) {
    return (
      <div className={styles.page}>
        <p className={styles.noteText}>This product couldn&apos;t be loaded right now. Try again shortly.</p>
      </div>
    );
  }

  const isBuyer = user.current_role === 'buyer';
  const imageUrl = primaryImageUrl(product) ?? '/assets/images/products/sony-headphones.png';
  const related = recommended.filter((p) => p.id !== product.id).slice(0, 4);

  const stockLabel = isOutOfStock(product) ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock';
  const stockClass = isOutOfStock(product) ? styles.stockOut : product.stock <= 5 ? styles.stockLow : styles.stockAvailable;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/marketplace">Marketplace</Link> / {product.name}
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
              <div className={styles.sellerInfo}>
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

          <PurchaseActions productId={product.id} productName={product.name} stock={product.stock} isBuyer={isBuyer} />
        </div>
      </div>

      <section>
        <h2 className={styles.sectionTitle}>Reviews</h2>
        <ReviewForm productId={product.id} />

        <div className={styles.reviewList}>
          {reviews.items.map((review) => (
            <article key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHead}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={review.user?.profile_picture_url || '/Logo.png'} alt="" className={styles.reviewAvatar} />
                <div className={styles.reviewer}>
                  <p className={styles.reviewerName}>{review.user?.username ?? 'Verified buyer'}</p>
                  <div className={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill={i < review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                {review.is_verified && <span className={styles.verifiedPurchase}>Verified purchase</span>}
              </div>
              {review.title && <p className={styles.reviewTitle}>{review.title}</p>}
              <p className={styles.reviewContent}>{review.content}</p>
              <p className={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</p>
            </article>
          ))}
          {reviews.items.length === 0 && <div className={styles.emptyReviews}>No reviews yet — be the first to write one.</div>}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>You might also like</h2>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
