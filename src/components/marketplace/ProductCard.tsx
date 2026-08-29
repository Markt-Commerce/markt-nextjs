import Link from 'next/link';
import { Star } from 'lucide-react';
import { discountPercent, hasDiscount, isOutOfStock, primaryImageUrl, type Product } from '@/lib/types/product';
import { FavoriteButton } from './FavoriteButton';
import styles from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const imageUrl = primaryImageUrl(product) ?? '/assets/images/products/sony-headphones.png';

  return (
    <Link href={`/app/marketplace/product/${product.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={product.name} className={styles.image} />
        {hasDiscount(product) && <span className={styles.discountBadge}>-{discountPercent(product)}%</span>}
        {isOutOfStock(product) && <div className={styles.outOfStockBadge}>Out of stock</div>}
        <div className={styles.favoriteWrap}>
          <FavoriteButton productId={product.id} size={14} />
        </div>
      </div>
      <div className={styles.body}>
        {product.seller && <span className={styles.sellerRow}>{product.seller.shop_name}</span>}
        <p className={styles.name}>{product.name}</p>
        <div className={styles.ratingRow}>
          <Star size={12} fill="currentColor" />
          <span>{product.average_rating.toFixed(1)} ({product.review_count})</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {hasDiscount(product) && <span className={styles.comparePrice}>${product.compare_at_price!.toFixed(2)}</span>}
        </div>
      </div>
    </Link>
  );
}
