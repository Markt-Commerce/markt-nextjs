'use client';

import { useState, useTransition } from 'react';
import { AlertCircle } from 'lucide-react';
import { initiatePaymentAction } from './actions';
import styles from './page.module.css';

export function PayNowButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onClick = () => {
    startTransition(async () => {
      const result = await initiatePaymentAction(orderId);
      if (result.url) {
        // Remember which payment this is, keyed by order, so that when Paystack
        // sends the buyer back we can verify this exact payment by id instead of
        // relying on the payments-list lookup (which has 500'd). sessionStorage
        // survives the gateway round-trip (same origin) and is best-effort —
        // the confirmation page still works without it.
        if (result.paymentId) {
          try {
            sessionStorage.setItem(`markt:pay:${orderId}`, result.paymentId);
          } catch {
            /* private mode / storage disabled — fall back to list lookup */
          }
        }
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
      {error && (
        <div className={styles.payError} role="alert">
          <AlertCircle size={16} className={styles.payErrorIcon} aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
