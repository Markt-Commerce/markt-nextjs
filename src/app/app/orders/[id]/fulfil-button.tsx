'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { advanceOrderItemAction } from '../actions';
import styles from './page.module.css';

export function FulfilButton({
  itemId,
  orderId,
  nextStatus,
  label,
}: {
  itemId: number;
  orderId: string;
  nextStatus: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await advanceOrderItemAction(itemId, nextStatus, orderId);
      if (result.error) toast(result.error, 'error');
      else {
        toast('Order updated.', 'success');
        router.refresh();
      }
    });
  };

  return (
    <button type="button" className={styles.fulfilBtn} onClick={onClick} disabled={pending}>
      {pending ? 'Updating…' : label} <ArrowRight size={14} />
    </button>
  );
}
