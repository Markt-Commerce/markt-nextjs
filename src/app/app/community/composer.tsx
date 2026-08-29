'use client';

import { useActionState } from 'react';
import { createPostAction, type PostFormState } from './actions';
import styles from './social-feed/page.module.css';

const initialState: PostFormState = {};

export function Composer() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);

  return (
    <form className={styles.composer} action={formAction}>
      <textarea className={styles.composerInput} name="caption" placeholder="Share something with the community…" required />
      {state.error && <p style={{ fontSize: '0.78rem', color: '#b91c1c' }}>{state.error}</p>}
      <button type="submit" className={styles.composerBtn} disabled={pending}>
        {pending ? 'Posting…' : 'Post'}
      </button>
    </form>
  );
}
