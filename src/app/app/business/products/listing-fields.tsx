'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { BusinessListing, BusinessOption } from '@/lib/types/business';
import styles from '../business.module.css';

/**
 * The business-terms inputs, shared by "new product" and "edit terms".
 * Field names match what listingFromForm in ../actions.ts reads.
 */
export function ListingFields({ units, listing }: { units: BusinessOption[]; listing?: BusinessListing | null }) {
  return (
    <>
      <div className={styles.row3}>
        <div className={styles.field}>
          <label htmlFor="unit">Unit</label>
          <select id="unit" name="unit" className={styles.select} defaultValue={listing?.unit ?? ''} required>
            <option value="" disabled>
              Choose a unit
            </option>
            {units.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="available_quantity">Available quantity</label>
          <input
            id="available_quantity"
            name="available_quantity"
            type="number"
            min={0}
            step="any"
            className={styles.input}
            defaultValue={listing?.available_quantity ?? ''}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="min_order_quantity">Minimum order</label>
          <input
            id="min_order_quantity"
            name="min_order_quantity"
            type="number"
            min={0}
            step="any"
            className={styles.input}
            defaultValue={listing?.min_order_quantity ?? ''}
          />
        </div>
      </div>

      <label className={styles.check} style={{ alignSelf: 'flex-start' }}>
        <input type="checkbox" name="price_negotiable" defaultChecked={listing?.price_negotiable ?? false} />
        Price is negotiable
      </label>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="production_capacity">Production capacity</label>
          <input
            id="production_capacity"
            name="production_capacity"
            className={styles.input}
            defaultValue={listing?.production_capacity ?? ''}
            maxLength={150}
            placeholder="e.g. 20 tonnes per month"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="availability">Availability</label>
          <input
            id="availability"
            name="availability"
            className={styles.input}
            defaultValue={listing?.availability ?? ''}
            maxLength={150}
            placeholder="e.g. Year-round, October to February"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="listing_city">City / town</label>
          <input id="listing_city" name="city" className={styles.input} defaultValue={listing?.city ?? ''} maxLength={100} />
        </div>
        <div className={styles.field}>
          <label htmlFor="listing_state">State</label>
          <input id="listing_state" name="state" className={styles.input} defaultValue={listing?.state ?? ''} maxLength={100} />
          <p className={styles.hint}>Leave blank to use your business location.</p>
        </div>
      </div>

      <SpecificationRows initial={listing?.specifications ?? null} />
    </>
  );
}

/** Free-form name/value pairs ("Moisture" / "12%"), submitted as spec_key[] and spec_value[]. */
export function SpecificationRows({ initial }: { initial: Record<string, string> | null }) {
  const [rows, setRows] = useState<{ id: number; key: string; value: string }[]>(() => {
    const entries = Object.entries(initial ?? {});
    return (entries.length ? entries : [['', '']]).map(([key, value], i) => ({ id: i, key, value }));
  });

  return (
    <div className={styles.field}>
      <span className={styles.label}>Specifications</span>
      <p className={styles.hint}>Grade, variety, size, material — whatever buyers compare on.</p>
      {rows.map((row, i) => (
        <div key={row.id} className={styles.specRow} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) auto' }}>
          <input name="spec_key" className={styles.input} defaultValue={row.key} placeholder="e.g. Moisture" aria-label={`Specification ${i + 1} name`} />
          <input name="spec_value" className={styles.input} defaultValue={row.value} placeholder="e.g. 12% max" aria-label={`Specification ${i + 1} value`} />
          <button
            type="button"
            className={styles.btnOutline}
            style={{ padding: '0.5rem' }}
            aria-label="Remove specification"
            onClick={() => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== row.id) : r))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.btnOutline}
        style={{ alignSelf: 'flex-start' }}
        onClick={() => setRows((r) => [...r, { id: Math.max(...r.map((x) => x.id)) + 1, key: '', value: '' }])}
      >
        <Plus size={14} /> Add specification
      </button>
    </div>
  );
}
