'use client';

import { useActionState } from 'react';
import { updateAddressAction, type SettingsFormState } from './actions';
import type { Address } from '@/lib/types/user';
import styles from './page.module.css';

const initialState: SettingsFormState = {};

const FIELDS: { key: keyof Address; label: string; full?: boolean }[] = [
  { key: 'street', label: 'Street', full: true },
  { key: 'house_number', label: 'House / Apt number' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal code' },
  { key: 'country', label: 'Country', full: true },
];

export function AddressForm({ address }: { address?: Address }) {
  const [state, formAction, pending] = useActionState(updateAddressAction, initialState);

  return (
    <form action={formAction}>
      <div className={styles.formGrid}>
        {FIELDS.map(({ key, label, full }) => (
          <div key={key} className={styles.field} style={full ? { gridColumn: '1 / -1' } : undefined}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              name={key}
              className={styles.input}
              defaultValue={typeof address?.[key] === 'string' ? (address[key] as string) : ''}
            />
          </div>
        ))}
      </div>

      {state.error && <p className={styles.errorText}>{state.error}</p>}
      {state.success && <p className={styles.successText}>Saved</p>}

      <button type="submit" className={styles.submitBtn} disabled={pending} style={{ marginTop: '0.25rem' }}>
        {pending ? 'Saving…' : 'Save address'}
      </button>
    </form>
  );
}
