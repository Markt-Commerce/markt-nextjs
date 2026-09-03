'use client';

import { useActionState, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { deleteAccountAction, type SettingsFormState } from './actions';
import styles from './page.module.css';

const initialState: SettingsFormState = {};

/**
 * Account deletion. Wired to the real API: the action runs the server-side
 * deletion-check, then `DELETE /users/account`, clears the session, and
 * redirects to the public marketplace.
 */
export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const canDelete = confirm.trim().toUpperCase() === 'DELETE';

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
        <form action={formAction} className={styles.dangerConfirm}>
          <p className={styles.dangerNote}>
            This permanently deletes your account and all associated data. You&apos;ll be signed out immediately and this
            can&apos;t be reversed.
          </p>

          <label className={styles.field}>
            <span>
              Type <strong>DELETE</strong> to confirm
            </span>
            <input
              name="confirm"
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </label>

          {state.error && <p className={styles.errorText}>{state.error}</p>}

          <div className={styles.dangerActions}>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => {
                setOpen(false);
                setConfirm('');
              }}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className={styles.dangerBtn} disabled={!canDelete || pending}>
              <Trash2 size={15} /> {pending ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
