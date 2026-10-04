'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Store, ArrowRight } from 'lucide-react';
import { enableBuyerAction, switchRoleAction, type SettingsFormState } from './actions';
import type { UserProfile } from '@/lib/types/user';
import styles from './page.module.css';

const initialState: SettingsFormState = {};

export function RolePanel({ user }: { user: UserProfile }) {
  const hasBoth = user.is_buyer && user.is_seller;
  const otherRole = user.current_role === 'buyer' ? 'seller' : 'buyer';
  const sellerPending = user.is_seller && user.seller_account?.verification_status !== 'verified';

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

      {/* Becoming a seller is a reviewed application (documents required), not an
          instant toggle — route to the dedicated flow. */}
      {!user.is_seller && (
        <Link href="/app/become-seller" className={styles.sellerCta}>
          <span className={styles.sellerCtaIcon}>
            <Store size={18} />
          </span>
          <span className={styles.sellerCtaBody}>
            <span className={styles.sellerCtaTitle}>Start selling on Markt</span>
            <span className={styles.sellerCtaDesc}>Apply to open a shop — we verify sellers to keep Markt safe.</span>
          </span>
          <ArrowRight size={16} className={styles.sellerCtaArrow} />
        </Link>
      )}

      {sellerPending && (
        <p className={styles.sectionDesc} style={{ marginTop: '1rem' }}>
          Your seller application is in review. <Link href="/app/become-seller">Check status</Link>.
        </p>
      )}
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

