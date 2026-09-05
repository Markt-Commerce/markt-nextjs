'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { toggleFollowAction } from './actions';
import styles from './post/[id]/page.module.css';

export function FollowButton({ userId, initialFollowing = false }: { userId: string; initialFollowing?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
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
