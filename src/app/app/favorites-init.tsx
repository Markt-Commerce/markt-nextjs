'use client';

import { useEffect } from 'react';
import { initRemoteFavorites, setRemoteHandlers } from '@/lib/favorites-storage';
import { saveFavoriteAction, unsaveFavoriteAction } from './favorites/actions';

/**
 * Seeds the client favorites store from the signed-in user's backend wishlist
 * and points save/unsave at the server (so the heart persists across devices).
 * Renders nothing. The public logged-out marketplace never mounts this, so it
 * keeps its localStorage behaviour.
 */
export function FavoritesInit({ ids }: { ids: string[] }) {
  // Depend on the joined ids, not the array identity, so this only re-seeds
  // when the actual set of saved products changes.
  const key = ids.join(',');
  useEffect(() => {
    setRemoteHandlers(
      (id) => void saveFavoriteAction(id),
      (id) => void unsaveFavoriteAction(id),
    );
    initRemoteFavorites(key ? key.split(',') : []);
  }, [key]);

  return null;
}
