'use client';

import { useActionState } from 'react';
import { createProcurementAction, type BusinessFormState } from '../../actions';
import type { BusinessOption } from '@/lib/types/business';
import { SpecificationRows } from '../../products/listing-fields';
import styles from '../../business.module.css';

const initialState: BusinessFormState = {};

export function ProcurementForm({ units, defaultLocation }: { units: BusinessOption[]; defaultLocation: string }) {
  const [state, formAction, pending] = useActionState(createProcurementAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className={styles.form}>
      <fieldset className={`${styles.fieldset} ${styles.card}`}>
        <legend className={styles.legend}>The requirement</legend>
        <div className={styles.field}>
          <label htmlFor="title">Product or material</label>
          <input id="title" name="title" className={styles.input} required maxLength={100} placeholder="e.g. Fresh cassava roots" />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            required
            minLength={10}
            maxLength={2000}
            placeholder="What it's for, quality expectations, how often you need it, anything suppliers should know."
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" name="quantity" type="number" min={0} step="any" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="unit">Unit</label>
            <select id="unit" name="unit" className={styles.select} defaultValue="">
              <option value="">Choose a unit</option>
              {units.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SpecificationRows initial={null} />
      </fieldset>

      <fieldset className={`${styles.fieldset} ${styles.card}`}>
        <legend className={styles.legend}>Delivery and budget</legend>
        <div className={styles.field}>
          <label htmlFor="delivery_location">Delivery location</label>
          <input id="delivery_location" name="delivery_location" className={styles.input} defaultValue={defaultLocation} maxLength={255} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="required_delivery_date">Needed by (optional)</label>
            <input id="required_delivery_date" name="required_delivery_date" type="date" min={today} className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="budget">Budget in ₦ (optional)</label>
            <input id="budget" name="budget" type="number" min={0} step="any" className={styles.input} />
            <p className={styles.hint}>Leave blank to let suppliers quote.</p>
          </div>
        </div>
      </fieldset>

      {state.error && <p className={styles.errorText}>{state.error}</p>}
      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary} disabled={pending}>
          {pending ? 'Posting…' : 'Post request'}
        </button>
      </div>
    </form>
  );
}
