'use client';

import { useActionState } from 'react';
import { requestVerificationAction, type BusinessFormState } from '../actions';
import styles from '../business.module.css';

const initialState: BusinessFormState = {};

export function VerificationRequestButton() {
  const [state, formAction, pending] = useActionState(requestVerificationAction, initialState);
  return (
    <form action={formAction} className={styles.form} style={{ gap: '0.5rem' }}>
      <button type="submit" className={styles.btnOutline} disabled={pending || state.success}>
        {pending ? 'Sending…' : state.success ? 'Request sent' : 'Request verification'}
      </button>
      {state.error && <p className={styles.errorText}>{state.error}</p>}
    </form>
  );
}
