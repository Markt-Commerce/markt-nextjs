'use client';

import { useState, useTransition } from 'react';
import { Share2 } from 'lucide-react';
import { recordShareAction } from './actions';
import styles from './page.module.css';

export function ShareButton({ productId, productName }: { productId: string; productName: string }) {
  const [message, setMessage] = useState('');
  const [, startTransition] = useTransition();

  const onShare = () => {
    startTransition(() => {
      recordShareAction(productId);
    });

    const url = `${window.location.origin}/app/marketplace/product/${productId}`;
    if (navigator.share) {
      navigator.share({ title: productName, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      setMessage('Link copied to clipboard');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <>
      <button type="button" className={styles.iconBtn} onClick={onShare} aria-label="Share product">
        <Share2 size={16} />
      </button>
      {message && <p className={styles.noteText}>{message}</p>}
    </>
  );
}
