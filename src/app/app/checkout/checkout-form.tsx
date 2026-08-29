'use client';

import { useActionState, useState } from 'react';
import { checkoutAction, type CheckoutActionState } from '../cart/actions';
import type { Cart } from '@/lib/types/cart';
import styles from './page.module.css';

const initialState: CheckoutActionState = {};

const ADDRESS_FIELDS: { key: string; label: string; full?: boolean }[] = [
  { key: 'street', label: 'Street', full: true },
  { key: 'house_number', label: 'House / Apt number' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal code' },
  { key: 'country', label: 'Country', full: true },
];

export function CheckoutForm({ cart, subtotal, discount }: { cart: Cart; subtotal: number; discount: number }) {
  const [state, formAction, pending] = useActionState(checkoutAction, initialState);
  const [billingSame, setBillingSame] = useState(true);

  return (
    <form action={formAction}>
      <div className={styles.layout}>
        <div>
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Shipping address</p>
            <AddressFields prefix="shipping" />
          </div>

          <div className={styles.section}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="billing_same"
                checked={billingSame}
                onChange={(e) => setBillingSame(e.target.checked)}
              />
              Billing address same as shipping
            </label>
            {!billingSame && (
              <>
                <p className={styles.sectionTitle}>Billing address</p>
                <AddressFields prefix="billing" />
              </>
            )}
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Order notes (optional)</p>
            <textarea className={styles.textarea} name="notes" placeholder="Delivery instructions, preferred pickup time, etc." />
          </div>
        </div>

        <aside className={styles.summary}>
          <p className={styles.sectionTitle}>Order Summary</p>
          {cart.items.map((item) => (
            <div key={item.id} className={styles.summaryItem}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>${(item.product_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className={styles.summaryItem}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryItem}>
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${(subtotal - discount).toFixed(2)}</span>
          </div>

          {state.error && <p className={styles.errorText}>{state.error}</p>}

          <button type="submit" className={styles.placeOrderBtn} disabled={pending}>
            {pending ? 'Placing order…' : 'Place Order'}
          </button>
        </aside>
      </div>
    </form>
  );
}

function AddressFields({ prefix }: { prefix: 'shipping' | 'billing' }) {
  return (
    <div className={styles.formGrid}>
      {ADDRESS_FIELDS.map(({ key, label, full }) => (
        <div key={key} className={styles.field} style={full ? { gridColumn: '1 / -1' } : undefined}>
          <label>{label}</label>
          <input className={styles.input} name={`${prefix}_${key}`} />
        </div>
      ))}
    </div>
  );
}
