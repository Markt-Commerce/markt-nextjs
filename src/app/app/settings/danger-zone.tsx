'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import styles from './page.module.css';

/**
 * Account deletion. The backend currently exposes no self-serve delete
 * endpoint (there is no DELETE /users/… in the API), so the confirmed action
 * opens a pre-filled deletion request to support rather than faking a delete.
 * Swap `requestDeletion()` for a server action calling the real endpoint the
 * moment one exists.
 */
export function DangerZone({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const canDelete = confirm.trim().toUpperCase() === 'DELETE';

  const requestDeletion = () => {
    const subject = encodeURIComponent('Account deletion request');
    const body = encodeURIComponent(
      `Please permanently delete my Markt account and all associated data.\n\nUsername: ${username}\n`
    );
    window.location.href = `mailto:support@marktcommerce.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className={cn(styles.section, styles.dangerSection)}>
      <p className={cn(styles.sectionTitle, styles.dangerTitle)}>
        <AlertTriangle size={16} /> Delete account
      </p>
      <p className={styles.sectionDesc}>
        Permanently remove your account and everything tied to it — orders, posts, and shop. This can&apos;t be undone.
      </p>

      {!open ? (
        <button type="button" className={styles.dangerBtn} onClick={() => setOpen(true)}>
          <Trash2 size={15} /> Delete account
        </button>
      ) : (
        <div className={styles.dangerConfirm}>
          <p className={styles.dangerNote}>
            Self-serve deletion isn&apos;t available yet, so confirming will start your request with our support team,
            who will remove your account. You&apos;ll get a confirmation by email.
          </p>

          <label className={styles.field}>
            <span>
              Type <strong>DELETE</strong> to confirm
            </span>
            <input
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </label>

          <div className={styles.dangerActions}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => {
                setOpen(false);
                setConfirm('');
              }}
            >
              Cancel
            </button>
            <button type="button" className={styles.dangerBtn} disabled={!canDelete} onClick={requestDeletion}>
              <Trash2 size={15} /> Request deletion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
