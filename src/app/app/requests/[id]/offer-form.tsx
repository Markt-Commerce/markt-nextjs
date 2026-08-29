'use client';

import { useActionState } from 'react';
import { createOfferAction, type OfferFormState } from './actions';
import styles from './page.module.css';

const initialState: OfferFormState = {};

export function OfferForm({ requestId }: { requestId: string }) {
  const boundAction = createOfferAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form className={styles.offerForm} action={formAction}>
      <p className={styles.sectionTitle}>Make an Offer</p>
      <div className={styles.field}>
        <label htmlFor="price">Your price</label>
        <input id="price" name="price" type="number" min={0} step="0.01" className={styles.input} placeholder="$" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" className={styles.textarea} placeholder="Tell the buyer what you have…" required />
      </div>
      {state.error && <p className={styles.offerMessage}>{state.error}</p>}
      {state.success && <p className={styles.offerMessage}>Offer sent!</p>}
      <button type="submit" className={styles.submitBtn} disabled={pending}>
        {pending ? 'Sending…' : 'Send Offer'}
      </button>
    </form>
  );
}
