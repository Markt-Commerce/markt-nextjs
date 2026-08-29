'use client';

import { useActionState, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { submitReviewAction, type ReviewActionState } from './actions';
import styles from './page.module.css';

const initialState: ReviewActionState = {};

export function ReviewForm({ productId }: { productId: string }) {
  const boundAction = submitReviewAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [rating, setRating] = useState(5);

  return (
    <form className={styles.reviewForm} action={formAction}>
      <input type="hidden" name="rating" value={rating} />
      <div className={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={cn(styles.starButton, n <= rating && styles.starButtonActive)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star size={18} fill={n <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <textarea className={styles.textarea} name="content" placeholder="Share your thoughts on this product…" required />
      {state.error && <p className={styles.noteText}>{state.error}</p>}
      {state.success && <p className={styles.noteText}>Review posted</p>}
      <button type="submit" className={styles.primaryBtn} style={{ flex: 'none' }} disabled={pending}>
        {pending ? 'Posting…' : 'Post Review'}
      </button>
    </form>
  );
}
