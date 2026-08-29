'use client';

import { useActionState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { createRequestAction, type CreateRequestState } from './actions';
import styles from './page.module.css';

const initialState: CreateRequestState = {};

export default function CreateRequestPage() {
  const [state, formAction, pending] = useActionState(createRequestAction, initialState);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <ClipboardPlus size={22} /> Post a Buy Request
      </h1>

      <form className={styles.formCard} action={formAction}>
        <div className={styles.field}>
          <label htmlFor="title">What are you looking for?</label>
          <input id="title" name="title" className={styles.input} placeholder="e.g. Noise-cancelling headphones" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="description">Details</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            placeholder="Condition, size, timeline — anything sellers should know."
            minLength={10}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="budget">Budget (optional)</label>
            <input id="budget" name="budget" type="number" min={0} className={styles.input} placeholder="$" />
          </div>
          <div className={styles.field}>
            <label htmlFor="expires_at">Expires (optional)</label>
            <input id="expires_at" name="expires_at" type="date" className={styles.input} />
          </div>
        </div>

        {state.error && <p className={styles.errorText}>{state.error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={pending}>
          {pending ? 'Posting…' : 'Post Request'}
        </button>
      </form>
    </div>
  );
}
