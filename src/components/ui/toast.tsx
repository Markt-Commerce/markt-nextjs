'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './toast.module.css';

type ToastType = 'error' | 'success' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const EVENT = 'markt:toast';

/** Fire a brief toast from anywhere on the client. */
export function toast(message: string, type: ToastType = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, type } }));
}

const ICONS = { error: AlertTriangle, success: CheckCircle2, info: Info };

/** Mount once (root layout). Listens for toast events and renders them. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type: ToastType };
      const id = Date.now() + Math.random();
      setItems((list) => [...list, { id, message: detail.message, type: detail.type ?? 'info' }]);
      window.setTimeout(() => remove(id), 4200);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [remove]);

  if (items.length === 0) return null;

  return (
    <div className={styles.wrap} aria-live="polite" role="status">
      {items.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={cn(styles.toast, styles[t.type])}>
            <Icon size={16} className={styles.icon} />
            <span className={styles.message}>{t.message}</span>
            <button type="button" className={styles.close} onClick={() => remove(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
