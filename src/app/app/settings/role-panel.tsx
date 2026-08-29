'use client';

import { useActionState } from 'react';
import { enableBuyerAction, enableSellerAction, switchRoleAction, type SettingsFormState } from './actions';
import type { UserProfile } from '@/lib/types/user';
import styles from './page.module.css';

const initialState: SettingsFormState = {};

export function RolePanel({ user }: { user: UserProfile }) {
  const hasBoth = user.is_buyer && user.is_seller;
  const otherRole = user.current_role === 'buyer' ? 'seller' : 'buyer';

  return (
    <>
      <div className={styles.roleRow}>
        <p className={styles.currentRole}>
          Currently browsing as a <strong>{user.current_role}</strong>.
        </p>
        {hasBoth && (
          <form action={switchRoleAction}>
            <button type="submit" className={styles.outlineBtn}>
              Switch to {otherRole}
            </button>
          </form>
        )}
      </div>

      {!user.is_buyer && <EnableBuyerForm />}
      {!user.is_seller && <EnableSellerForm />}
    </>
  );
}

function EnableBuyerForm() {
  const [state, formAction, pending] = useActionState(enableBuyerAction, initialState);

  return (
    <form action={formAction} style={{ marginTop: '1rem' }}>
      <p className={styles.sectionDesc} style={{ margin: '0 0 0.6rem' }}>
        You don&apos;t have a buyer account yet — add one to start shopping.
      </p>
      <div className={styles.field}>
        <label htmlFor="buyername">Display name</label>
        <input id="buyername" name="buyername" className={styles.input} placeholder="How sellers see you" required />
      </div>
      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Buyer account enabled</p>}
      <button type="submit" className={styles.outlineBtn} disabled={pending}>
        {pending ? 'Enabling…' : 'Enable buyer account'}
      </button>
    </form>
  );
}

function EnableSellerForm() {
  const [state, formAction, pending] = useActionState(enableSellerAction, initialState);

  return (
    <form action={formAction} style={{ marginTop: '1rem' }}>
      <p className={styles.sectionDesc} style={{ margin: '0 0 0.6rem' }}>
        You don&apos;t have a seller account yet — add one to start selling.
      </p>
      <div className={styles.field}>
        <label htmlFor="shop_name">Shop name</label>
        <input id="shop_name" name="shop_name" className={styles.input} placeholder="Your shop's name" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">Shop description</label>
        <input id="description" name="description" className={styles.input} placeholder="What you sell" required />
      </div>
      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Seller account enabled</p>}
      <button type="submit" className={styles.outlineBtn} disabled={pending}>
        {pending ? 'Enabling…' : 'Enable seller account'}
      </button>
    </form>
  );
}
