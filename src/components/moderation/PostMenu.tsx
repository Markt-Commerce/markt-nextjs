'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Flag, Ban } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { blockUserAction } from '@/app/app/moderation-actions';
import { ReportDialog } from './ReportDialog';
import styles from './moderation.module.css';

/** The ⋯ menu on a feed post: Report the post, or block its author. */
export function PostMenu({ postId, authorId, authorName }: { postId: string; authorId?: string; authorName?: string }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const block = () => {
    if (!authorId) return;
    setOpen(false);
    startTransition(async () => {
      const res = await blockUserAction(authorId);
      if (res.ok) {
        toast(`You won’t see posts from ${authorName ? `@${authorName}` : 'this user'} anymore.`, 'success');
        router.refresh();
      } else {
        toast('Could not block that user. Try again.', 'error');
      }
    });
  };

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <button type="button" className={styles.menuBtn} aria-label="Post options" aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setReporting(true);
            }}
          >
            <Flag size={15} /> Report post
          </button>
          {authorId && (
            <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} role="menuitem" onClick={block}>
              <Ban size={15} /> Block {authorName ? `@${authorName}` : 'user'}
            </button>
          )}
        </div>
      )}

      {reporting && (
        <ReportDialog contentId={postId} contentType="post" label="this post" onClose={() => setReporting(false)} />
      )}
    </div>
  );
}
