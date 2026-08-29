'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { toggleFollowAction } from './actions';
import styles from './post/[id]/page.module.css';

export function FollowButton({ userId }: { userId: string }) {
  const [following, setFollowing] = useState(false);
  const [, startTransition] = useTransition();

  const onClick = () => {
    const next = !following;
    setFollowing(next);
    startTransition(() => toggleFollowAction(userId, !next));
  };

  return (
    <button type="button" className={cn(styles.followBtn, following && styles.followBtnActive)} onClick={onClick}>
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
