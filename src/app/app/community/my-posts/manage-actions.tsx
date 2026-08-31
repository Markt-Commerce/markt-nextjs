'use client';

import { useState, useTransition } from 'react';
import { Archive, ArchiveRestore, Send, Trash2 } from 'lucide-react';
import type { PostStatusAction } from '@/lib/types/post';
import { changePostStatusAction, deletePostAction } from './actions';
import styles from './page.module.css';

type Tab = 'published' | 'drafts' | 'archived';

export function ManageActions({ postId, tab }: { postId: string; tab: Tab }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError('');
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
    });
  };

  const status = (action: PostStatusAction) => run(() => changePostStatusAction(postId, action));

  return (
    <div className={styles.actions}>
      {/* Drafts and archived posts can be (re)published. */}
      {(tab === 'drafts' || tab === 'archived') && (
        <button type="button" className={styles.actionPrimary} disabled={pending} onClick={() => status(tab === 'archived' ? 'unarchive' : 'publish')}>
          {tab === 'archived' ? <ArchiveRestore size={14} /> : <Send size={14} />}
          {tab === 'archived' ? 'Restore' : 'Publish'}
        </button>
      )}

      {/* Live posts can be taken down to archive. */}
      {tab === 'published' && (
        <button type="button" className={styles.action} disabled={pending} onClick={() => status('archive')}>
          <Archive size={14} /> Archive
        </button>
      )}

      {confirming ? (
        <span className={styles.confirm}>
          <button type="button" className={styles.actionDanger} disabled={pending} onClick={() => run(() => deletePostAction(postId))}>
            Confirm delete
          </button>
          <button type="button" className={styles.action} disabled={pending} onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" className={styles.actionGhost} disabled={pending} onClick={() => setConfirming(true)} aria-label="Delete post">
          <Trash2 size={14} /> Delete
        </button>
      )}

      {error && <span className={styles.actionError}>{error}</span>}
    </div>
  );
}
