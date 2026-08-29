'use client';

import { useTransition } from 'react';
import { acceptOfferAction, rejectOfferAction } from './actions';
import styles from './page.module.css';

export function OfferActions({ requestId, offerId }: { requestId: string; offerId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={styles.offerActions}>
      <button type="button" className={styles.acceptBtn} disabled={pending} onClick={() => startTransition(() => acceptOfferAction(requestId, offerId))}>
        Accept
      </button>
      <button type="button" className={styles.rejectBtn} disabled={pending} onClick={() => startTransition(() => rejectOfferAction(requestId, offerId))}>
        Decline
      </button>
    </div>
  );
}
