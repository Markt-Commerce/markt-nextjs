'use client';

import { useActionState } from 'react';
import { saveListingAction, type BusinessFormState } from '../../actions';
import type { BusinessListing, BusinessOption } from '@/lib/types/business';
import { ListingFields } from '../listing-fields';
import styles from '../../business.module.css';

const initialState: BusinessFormState = {};

export function ListingTermsForm({
  productId,
  units,
  listing,
}: {
  productId: string;
  units: BusinessOption[];
  listing: BusinessListing | null;
}) {
  const [state, formAction, pending] = useActionState(saveListingAction.bind(null, productId), initialState);

  return (
    <form action={formAction} className={`${styles.form} ${styles.card}`}>
      <ListingFields units={units} listing={listing} />
      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Business terms saved.</p>}
      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? 'Saving…' : listing ? 'Save terms' : 'List for businesses'}
        </button>
      </div>
    </form>
  );
}
