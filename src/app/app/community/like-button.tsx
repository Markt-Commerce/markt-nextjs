'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toggleLikeAction } from './actions';

export function LikeButton({
  postId,
  initialCount,
  initialLiked = false,
  className,
  activeClassName,
}: {
  postId: string;
  initialCount: number;
  initialLiked?: boolean;
  className: string;
  activeClassName: string;
}) {
  // Seeded from the post's `liked_by_me` so the heart starts in the right state.
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  const onClick = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(() => toggleLikeAction(postId));
  };

  return (
    <button type="button" className={cn(className, liked && activeClassName)} onClick={onClick}>
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {count}
    </button>
  );
}
