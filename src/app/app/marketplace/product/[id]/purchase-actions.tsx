'use client';

import { useActionState, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { addToCartAction, type CartActionState } from '@/app/app/cart/actions';
import { FavoriteButton } from '@/components/marketplace/FavoriteButton';
import { ShareButton } from './share-button';
import styles from './page.module.css';

const initialState: CartActionState = {};

export function PurchaseActions({
  productId,
  productName,
  stock,
  isBuyer,
}: {
  productId: string;
  productName: string;
  stock: number;
  isBuyer: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <>
      {isBuyer && (
        <div className={styles.qtyRow}>
          <div className={styles.qtyControl}>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <span className={styles.qtyValue}>{quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
              disabled={quantity >= stock}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      <form action={formAction} className={styles.actionRow}>
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="quantity" value={quantity} />

        {isBuyer && (
          <>
            <button type="submit" name="redirectTo" value="" className={styles.primaryBtn} disabled={pending || stock < 1}>
              {pending ? 'Adding…' : 'Add to Cart'}
            </button>
            <button
              type="submit"
              name="redirectTo"
              value="/app/cart"
              className={styles.secondaryBtn}
              disabled={pending || stock < 1}
            >
              Buy Now
            </button>
          </>
        )}

        <ShareButton productId={productId} productName={productName} />
        <FavoriteButton productId={productId} size={18} />
      </form>

      {state.error && <p className={styles.noteText}>{state.error}</p>}
      {state.success && <p className={styles.noteText}>Added to cart</p>}
      {!isBuyer && <p className={styles.noteText}>Switch to a buyer account to purchase this item.</p>}
    </>
  );
}
