'use client';

import { useSyncExternalStore } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getFavoritesServerSnapshot, getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from '@/lib/favorites-storage';
import styles from './FavoriteButton.module.css';

export function FavoriteButton({
  productId,
  size = 16,
  className,
}: {
  productId: string;
  size?: number;
  // When a caller passes its own button styling (e.g. the product detail page,
  // to match the neighbouring share button), it fully replaces the default
  // card-overlay shape. Active state is then exposed via data-favorited so the
  // caller's own CSS can style it, avoiding cross-module specificity clashes.
  className?: string;
}) {
  const ids = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favorited = ids.includes(productId);

  return (
    <button
      type="button"
      className={className ? className : cn(styles.button, favorited && styles.buttonActive)}
      data-favorited={favorited ? '' : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={favorited}
    >
      <Heart size={size} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
