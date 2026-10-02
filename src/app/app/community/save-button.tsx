'use client';

import { useState, useTransition } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toggleSavePostAction } from './actions';

export function SaveButton({
  postId,
  initialSaved,
  className,
  activeClassName,
}: {
  postId: string;
  initialSaved: boolean;
  className: string;
  activeClassName: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  const onClick = () => {
    const next = !saved;
    setSaved(next);
    startTransition(() => toggleSavePostAction(postId, saved));
  };

  return (
    <button
      type="button"
      className={cn(className, saved && activeClassName)}
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove bookmark' : 'Save post'}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
