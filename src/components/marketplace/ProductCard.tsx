import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import { discountPercent, hasDiscount, isOutOfStock, primaryImageUrl, type Product } from '@/lib/types/product';
import { FavoriteButton } from './FavoriteButton';
import styles from './ProductCard.module.css';

export function ProductCard({
  product,
  // Where the card links. Defaults to the in-app product page; the public
  // marketplace passes "/product" so logged-out visitors can preview items.
  hrefBase = '/app/marketplace/product',
}: {
  product: Product;
  hrefBase?: string;
}) {
  const imageUrl = primaryImageUrl(product);
  const seller = product.seller;
  const outOfStock = isOutOfStock(product);
  const discounted = hasDiscount(product);

  const href = `${hrefBase}/${product.id}`;

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.seller}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={seller?.profile_picture_url || '/Logo.png'} alt="" className={styles.sellerAvatar} />
        <span className={styles.sellerName}>{seller?.shop_name ?? 'Markt seller'}</span>
        {seller?.verification_status === 'verified' && <BadgeCheck size={13} className={styles.verified} />}
      </div>

      <div className={styles.imageWrap}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} className={styles.image} loading="lazy" />
        )}

        {outOfStock ? (
          <span className={`${styles.tag} ${styles.tagOut}`}>Sold out</span>
        ) : discounted ? (
          <span className={`${styles.tag} ${styles.tagDeal}`}>-{discountPercent(product)}%</span>
        ) : null}

        <div className={styles.favorite}>
          <FavoriteButton productId={product.id} size={14} />
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.name}>{product.name}</p>

        {product.review_count > 0 && (
          <div className={styles.meta}>
            <Star size={11} fill="currentColor" />
            <span>
              {product.average_rating.toFixed(1)} · {product.review_count} review{product.review_count === 1 ? '' : 's'}
            </span>
          </div>
        )}

        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {discounted && <span className={styles.comparePrice}>${product.compare_at_price!.toFixed(2)}</span>}
        </div>
      </div>
    </Link>
  );
}
