'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import { unblockUserAction } from '../moderation-actions';
import styles from './page.module.css';

export function UnblockButton({ userId, username }: { userId: string; username: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    startTransition(async () => {
      const res = await unblockUserAction(userId);
      if (res.ok) {
        toast(`Unblocked @${username}.`, 'success');
        router.refresh();
      } else {
        toast('Could not unblock. Try again.', 'error');
      }
    });
  };

  return (
    <button type="button" className={styles.outlineBtn} onClick={onClick} disabled={pending}>
      {pending ? 'Unblocking…' : 'Unblock'}
    </button>
  );
}
