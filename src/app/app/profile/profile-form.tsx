'use client';

import { useActionState } from 'react';
import type { UserProfile } from '@/lib/types/user';
import { updateProfileAction, type ProfileFormState } from './actions';
import styles from './page.module.css';

const initialState: ProfileFormState = {};

export function ProfileForm({ user }: { user: UserProfile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form className={styles.formCard} action={formAction}>
      <input type="hidden" name="account_type" value={user.current_role} />

      <p className={styles.sectionTitle}>Contact details</p>

      <div className={styles.field}>
        <label>Email</label>
        <div className={styles.readonlyField}>{user.email}</div>
      </div>

      <div className={styles.field}>
        <label>Username</label>
        <div className={styles.readonlyField}>{user.username}</div>
      </div>

      <div className={styles.field}>
        <label htmlFor="phone_number">Phone number</label>
        <input id="phone_number" name="phone_number" className={styles.input} defaultValue={user.phone_number ?? ''} placeholder="+1234567890" />
      </div>

      {user.current_role === 'buyer' && (
        <div className={styles.field}>
          <label htmlFor="buyername">Display name</label>
          <input
            id="buyername"
            name="buyername"
            className={styles.input}
            defaultValue={user.buyer_account?.buyername ?? ''}
            placeholder="How sellers see you"
          />
        </div>
      )}

      {user.current_role === 'seller' && (
        <>
          <div className={styles.field}>
            <label htmlFor="shop_name">Shop name</label>
            <input
              id="shop_name"
              name="shop_name"
              className={styles.input}
              defaultValue={user.seller_account?.shop_name ?? ''}
              placeholder="Your shop's name"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="description">Shop description</label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              defaultValue={user.seller_account?.description ?? ''}
              placeholder="Tell buyers what you sell"
            />
          </div>
        </>
      )}

      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Saved</p>}

      <button type="submit" className={styles.submitBtn} disabled={pending} style={{ marginTop: '0.5rem' }}>
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
