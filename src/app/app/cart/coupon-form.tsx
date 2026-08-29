'use client';

import { useActionState } from 'react';
import { applyCouponAction, type CartActionState } from './actions';
import styles from './page.module.css';

const initialState: CartActionState = {};

export function CouponForm() {
  const [state, formAction, pending] = useActionState(applyCouponAction, initialState);

  return (
    <form action={formAction}>
      <div className={styles.couponRow}>
        <input className={styles.couponInput} name="code" placeholder="Coupon code" />
        <button type="submit" className={styles.couponBtn} disabled={pending}>
          Apply
        </button>
      </div>
      {state.error && <p className={`${styles.couponMessage} ${styles.couponError}`}>{state.error}</p>}
      {!state.error && state.message && <p className={`${styles.couponMessage} ${styles.couponSuccess}`}>{state.message}</p>}
    </form>
  );
}
