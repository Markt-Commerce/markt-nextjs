'use client';

import { useState, useTransition } from 'react';
import { XCircle } from 'lucide-react';
import { cancelOrderAction } from '../actions';
import styles from './page.module.css';

export function CancelButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onClick = () => {
    if (!confirm('Cancel this order?')) return;
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <>
      <div className={styles.actionRow}>
        <button type="button" className={styles.dangerBtn} disabled={pending} onClick={onClick}>
          <XCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
          {pending ? 'Cancelling…' : 'Cancel Order'}
        </button>
      </div>
      {error && <p className={styles.noteText}>{error}</p>}
    </>
  );
}
