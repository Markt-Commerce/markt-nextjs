'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * While a delivery is still moving, re-run the server component every so often
 * so the rider's progress (and the POD link) updates on its own. The rider's
 * app drives the state — nothing the buyer does here changes it — so a poll is
 * how this screen learns a rider arrived while they were watching it. Stops
 * when the component unmounts (the delivery completed, or they left).
 */
export function DeliveryLive({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
