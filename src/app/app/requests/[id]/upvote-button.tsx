'use client';

import { useTransition } from 'react';
import { ThumbsUp } from 'lucide-react';
import { upvoteRequestAction } from './actions';
import styles from './page.module.css';

export function UpvoteButton({ requestId, count }: { requestId: string; count: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={styles.upvoteBtn}
      disabled={pending}
      onClick={() => startTransition(() => upvoteRequestAction(requestId))}
    >
      <ThumbsUp size={13} /> {count}
    </button>
  );
}
