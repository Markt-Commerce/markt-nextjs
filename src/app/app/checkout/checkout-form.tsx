'use client';

import { useActionState, useEffect, useState } from 'react';
import { formatNaira } from '@/lib/format';
import { toast } from '@/components/ui/toast';
import { checkoutAction, type CheckoutActionState } from '../cart/actions';
import type { Cart } from '@/lib/types/cart';
import type { Address } from '@/lib/types/user';
import styles from './page.module.css';

const initialState: CheckoutActionState = {};

type AddrKey = 'street' | 'house_number' | 'city' | 'state' | 'postal_code' | 'country';
const ADDRESS_FIELDS: { key: AddrKey; label: string; full?: boolean }[] = [
  { key: 'street', label: 'Street', full: true },
  { key: 'house_number', label: 'House / Apt number' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal code' },
  { key: 'country', label: 'Country', full: true },
];

interface AddrForm {
  recipient_name: string;
  phone_number: string;
  street: string;
  house_number: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const EMPTY: AddrForm = {
  recipient_name: '',
  phone_number: '',
  street: '',
  house_number: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

/** The saved address, or null if it has no real location content yet. */
function savedAddr(a?: Address): Pick<AddrForm, AddrKey> | null {
  if (!a || !(a.street || a.city || a.postal_code)) return null;
  return {
    street: a.street ?? '',
    house_number: (a.house_number as string | undefined) ?? '',
    city: a.city ?? '',
    state: a.state ?? '',
    postal_code: a.postal_code ?? '',
    country: a.country ?? '',
  };
}

export function CheckoutForm({
  cart,
  subtotal,
  discount,
  savedAddress,
  defaultName,
}: {
  cart: Cart;
  subtotal: number;
  discount: number;
  savedAddress?: Address;
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState(checkoutAction, initialState);
  const saved = savedAddr(savedAddress);

  const [useSaved, setUseSaved] = useState(!!saved);
  const [ship, setShip] = useState<AddrForm>(() => ({ ...EMPTY, recipient_name: defaultName ?? '', ...(saved ?? {}) }));
  const [billingSame, setBillingSame] = useState(true);
  const [bill, setBill] = useState<AddrForm>(() => ({ ...EMPTY }));

  // Checkout errors surface as an app-wide toast, not buried in the summary.
  useEffect(() => {
    if (state.error) toast(state.error, 'error');
  }, [state.error]);

  const chooseSaved = (val: boolean) => {
    setUseSaved(val);
    setShip((s) => ({
      ...s,
      ...(val && saved ? saved : { street: '', house_number: '', city: '', state: '', postal_code: '', country: '' }),
    }));
  };

  const total = subtotal - discount;

  return (
    <form action={formAction}>
      <div className={styles.layout}>
        <div>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Shipping address</p>

            {saved && (
              <div className={styles.addrChoice}>
                <label className={styles.addrRadio}>
                  <input type="radio" name="__ship_mode" checked={useSaved} onChange={() => chooseSaved(true)} /> Use saved address
                </label>
                <label className={styles.addrRadio}>
                  <input type="radio" name="__ship_mode" checked={!useSaved} onChange={() => chooseSaved(false)} /> Add a new address
                </label>
              </div>
            )}

            <ContactFields prefix="shipping" values={ship} onChange={(k, v) => setShip((s) => ({ ...s, [k]: v }))} />
            {/* Always editable — "use saved" just prefills, so an incomplete saved
                address (e.g. missing street) can still be completed here. */}
            <AddressGrid prefix="shipping" values={ship} onChange={(k, v) => setShip((s) => ({ ...s, [k]: v }))} />
          </div>

          <div className={styles.section}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="billing_same" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
              Billing address same as shipping
            </label>
            {!billingSame && (
              <>
                <p className={styles.sectionTitle}>Billing address</p>
                <ContactFields prefix="billing" values={bill} onChange={(k, v) => setBill((s) => ({ ...s, [k]: v }))} />
                <AddressGrid prefix="billing" values={bill} onChange={(k, v) => setBill((s) => ({ ...s, [k]: v }))} />
              </>
            )}
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Order notes (optional)</p>
            <textarea className={styles.textarea} name="notes" rows={4} placeholder="Delivery instructions, preferred pickup time, etc." />
          </div>
        </div>

        <aside className={styles.summary}>
          <p className={styles.sectionTitle}>Order Summary</p>
          {cart.items.map((item) => (
            <div key={item.id} className={styles.summaryItem}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatNaira(item.product_price * item.quantity)}</span>
            </div>
          ))}
          <div className={styles.summaryItem}>
            <span>Subtotal</span>
            <span>{formatNaira(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryItem}>
              <span>Discount</span>
              <span>-{formatNaira(discount)}</span>
            </div>
          )}
          <div className={styles.tearLine} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>

          <button type="submit" className={styles.placeOrderBtn} disabled={pending}>
            {pending ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </div>
    </form>
  );
}

function ContactFields({
  prefix,
  values,
  onChange,
}: {
  prefix: string;
  values: AddrForm;
  onChange: (key: keyof AddrForm, value: string) => void;
}) {
  return (
    <div className={styles.formGrid}>
      <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
        <label>Recipient name</label>
        <input
          className={styles.input}
          name={`${prefix}_recipient_name`}
          value={values.recipient_name}
          onChange={(e) => onChange('recipient_name', e.target.value)}
          placeholder="Who is this order for?"
        />
      </div>
      <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
        <label>Phone number (optional)</label>
        <input
          className={styles.input}
          name={`${prefix}_phone_number`}
          value={values.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          placeholder="For delivery updates"
        />
      </div>
    </div>
  );
}

function AddressGrid({
  prefix,
  values,
  onChange,
  readOnly,
}: {
  prefix: string;
  values: AddrForm;
  onChange: (key: keyof AddrForm, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className={styles.formGrid}>
      {ADDRESS_FIELDS.map(({ key, label, full }) => (
        <div key={key} className={styles.field} style={full ? { gridColumn: '1 / -1' } : undefined}>
          <label>{label}</label>
          <input
            className={styles.input}
            name={`${prefix}_${key}`}
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}
