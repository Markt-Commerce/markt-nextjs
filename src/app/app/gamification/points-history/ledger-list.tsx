'use client';

import { useState, useTransition } from 'react';
import { reasonLabel } from '@/lib/gamification';
import type { PointsHistoryItem } from '@/lib/types/gamification';
import { loadMoreHistoryAction } from '../actions';
import styles from '../page.module.css';

export function LedgerList({
  initialItems,
  initialCursor,
}: {
  initialItems: PointsHistoryItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();

  const loadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await loadMoreHistoryAction(cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.next_cursor);
    });
  };

  if (items.length === 0) {
    return <p className={styles.emptyText}>No activity yet — earn points by buying, selling and posting.</p>;
  }

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className={styles.ledgerRow}>
          <div className={styles.ledgerLeft}>
            <div className={styles.ledgerReason}>{reasonLabel(item.reason)}</div>
            <div className={styles.ledgerDate}>
              {new Date(item.created_at).toLocaleDateString()} · balance {item.balance_after.toLocaleString('en-NG')}
            </div>
          </div>
          <span className={item.delta >= 0 ? styles.deltaPos : styles.deltaNeg}>
            {item.delta >= 0 ? '+' : '−'}
            {Math.abs(item.delta).toLocaleString('en-NG')}
          </span>
        </div>
      ))}

      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={pending}
          className={styles.segBtn}
          style={{ margin: '1rem auto 0', display: 'block', border: '1px solid var(--border)' }}
        >
          {pending ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  );
}
