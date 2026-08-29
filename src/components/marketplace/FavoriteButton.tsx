'use client';

import { useSyncExternalStore } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getFavoritesServerSnapshot, getFavoritesSnapshot, subscribeFavorites, toggleFavorite } from '@/lib/favorites-storage';
import styles from './FavoriteButton.module.css';

export function FavoriteButton({ productId, size = 16 }: { productId: string; size?: number }) {
  const ids = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favorited = ids.includes(productId);

  return (
    <button
      type="button"
      className={cn(styles.button, favorited && styles.buttonActive)}
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
