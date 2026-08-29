'use client';

import { useState, useTransition } from 'react';
import { initiatePaymentAction } from './actions';
import styles from './page.module.css';

export function PayNowButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onClick = () => {
    startTransition(async () => {
      const result = await initiatePaymentAction(orderId);
      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error ?? 'Could not start payment.');
      }
    });
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button type="button" className={styles.primaryBtn} onClick={onClick} disabled={pending} style={{ border: 0, cursor: 'pointer' }}>
        {pending ? 'Starting payment…' : 'Pay Now'}
      </button>
      {error && <p className={styles.note}>{error}</p>}
    </div>
  );
}
