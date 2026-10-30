'use client';

import { useActionState } from 'react';
import { createBusinessProductAction, type BusinessFormState } from '../../actions';
import type { BusinessOption } from '@/lib/types/business';
import { ListingFields } from '../listing-fields';
import styles from '../../business.module.css';

const initialState: BusinessFormState = {};

export function NewProductForm({ units }: { units: BusinessOption[] }) {
  const [state, formAction, pending] = useActionState(createBusinessProductAction, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <fieldset className={`${styles.fieldset} ${styles.card}`}>
        <legend className={styles.legend}>Product</legend>
        <div className={styles.field}>
          <label htmlFor="name">Product name</label>
          <input id="name" name="name" className={styles.input} required minLength={2} maxLength={100} placeholder="e.g. Fresh cassava roots" />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" className={styles.textarea} placeholder="Variety, grade, packaging, how it's stored." />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="price">Price per unit (₦)</label>
            <input id="price" name="price" type="number" min={0.01} step="0.01" className={styles.input} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="stock">Stock for Markt checkout (optional)</label>
            <input id="stock" name="stock" type="number" min={0} step={1} className={styles.input} />
            <p className={styles.hint}>Whole units buyers can order directly through checkout.</p>
          </div>
        </div>
      </fieldset>

      <fieldset className={`${styles.fieldset} ${styles.card}`}>
        <legend className={styles.legend}>Business terms</legend>
        <ListingFields units={units} />
      </fieldset>

      {state.error && <p className={styles.errorText}>{state.error}</p>}
      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? 'Creating…' : 'Create listing'}
        </button>
      </div>
    </form>
  );
}
