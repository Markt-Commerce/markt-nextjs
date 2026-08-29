'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Loader2 } from 'lucide-react';
import { getFavoriteIds } from '@/lib/favorites-storage';
import { primaryImageUrl, type Product } from '@/lib/types/product';
import { getFavoriteProductsAction } from './actions';
import styles from './page.module.css';

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    getFavoriteProductsAction(getFavoriteIds()).then(setProducts);
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <Heart size={22} fill="currentColor" /> Saved Items
      </h1>

      {products === null && <Loader2 className="animate-spin" size={20} />}

      {products?.length === 0 && (
        <div className={styles.emptyState}>
          Nothing saved yet. <Link href="/app/marketplace">Browse the marketplace</Link> and tap the heart on anything you like.
        </div>
      )}

      {products && products.length > 0 && (
        <div className={styles.grid}>
          {products.map((product) => (
            <Link key={product.id} href={`/app/marketplace/product/${product.id}`} className={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImageUrl(product) ?? '/assets/images/products/sony-headphones.png'}
                alt={product.name}
                className={styles.image}
              />
              <div className={styles.body}>
                <p className={styles.name}>{product.name}</p>
                <p className={styles.price}>${product.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
