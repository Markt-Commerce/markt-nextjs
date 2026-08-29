'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toggleLikeAction } from './actions';

export function LikeButton({
  postId,
  initialCount,
  className,
  activeClassName,
}: {
  postId: string;
  initialCount: number;
  className: string;
  activeClassName: string;
}) {
  // The real API doesn't tell us whether the current user already liked a
  // post (no is_liked field anywhere) — so this starts unliked every time
  // and just toggles from there, rather than guessing.
  const [liked, setLiked] = useState(false);
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
