'use client';

import { useActionState } from 'react';
import { createNicheAction, type NicheFormState } from './actions';
import styles from './niches.module.css';

const initialState: NicheFormState = {};

export function CreateNicheForm() {
  const [state, formAction, pending] = useActionState(createNicheAction, initialState);

  return (
    <form action={formAction} className={styles.createForm}>
      <div className={styles.field}>
        <label htmlFor="name">Community name</label>
        <input id="name" name="name" className={styles.input} placeholder="e.g. Lagos Sneakerheads" maxLength={100} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="description">What&apos;s it about?</label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          rows={3}
          placeholder="Describe your community (at least 10 characters)."
          minLength={10}
          maxLength={2000}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="visibility">Visibility</label>
        <select id="visibility" name="visibility" className={styles.input} defaultValue="public">
          <option value="public">Public — anyone can find and join</option>
          <option value="restricted">Restricted — anyone can find, approval to join</option>
          <option value="private">Private — invite only</option>
        </select>
      </div>

      {state.error && <p className={styles.formError}>{state.error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={pending}>
        {pending ? 'Creating…' : 'Create community'}
      </button>
    </form>
  );
}
