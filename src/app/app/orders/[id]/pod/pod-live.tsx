'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This screen is open at the exact moment a rider is confirming, so it can't be
 * a snapshot: the confirm happens on the rider's phone. Re-run the server
 * component every 10s so that once the code is used, this flips to "Delivered"
 * on its own instead of showing a spent code. Unmounts (and stops) as soon as
 * the code is no longer live.
 */
export function PodLive({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
