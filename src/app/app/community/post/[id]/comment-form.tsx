'use client';

import { useActionState } from 'react';
import { addCommentAction, type CommentFormState } from '../../actions';
import styles from './page.module.css';

const initialState: CommentFormState = {};

export function CommentForm({ postId }: { postId: string }) {
  const boundAction = addCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form className={styles.commentForm} action={formAction}>
      <input className={styles.commentInput} name="content" placeholder="Add a comment…" required />
      <button type="submit" className={styles.commentSubmit} disabled={pending}>
        {pending ? 'Posting…' : 'Post'}
      </button>
      {state.error && <p style={{ fontSize: '0.78rem', color: '#b91c1c', width: '100%' }}>{state.error}</p>}
    </form>
  );
}
