'use client';

import { useActionState } from 'react';
import { createOfferAction, type OfferFormState } from './actions';
import styles from './page.module.css';

const initialState: OfferFormState = {};

/** `quantityUnit` set means a procurement request: ask how much they can supply. */
export function OfferForm({ requestId, quantityUnit }: { requestId: string; quantityUnit?: string }) {
  const boundAction = createOfferAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form className={styles.offerForm} action={formAction}>
      <p className={styles.sectionTitle}>Make an Offer</p>
      <div className={styles.field}>
        <label htmlFor="price">Your price</label>
        <input id="price" name="price" type="number" min={0} step="0.01" className={styles.input} placeholder={quantityUnit !== undefined ? '₦' : '$'} required />
      </div>
      {quantityUnit !== undefined && (
        <div className={styles.field}>
          <label htmlFor="proposed_quantity">How much can you supply?{quantityUnit ? ` (${quantityUnit})` : ''}</label>
          <input id="proposed_quantity" name="proposed_quantity" type="number" min={0} step="any" className={styles.input} />
        </div>
      )}
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
