'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/lib/favorites-storage';
import { unsaveFavoriteAction } from './actions';
import styles from './page.module.css';

/** Remove one product from the wishlist, then refresh the list. */
export function UnsaveButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.removeBtn}
      disabled={pending}
      aria-label="Remove from saved items"
      onClick={() => {
        // Keep the shared store in sync so hearts elsewhere update too.
        toggleFavorite(productId);
        startTransition(async () => {
          await unsaveFavoriteAction(productId);
          router.refresh();
        });
      }}
    >
      <Heart size={15} fill="currentColor" />
    </button>
  );
}
