'use client';

import { useTransition } from 'react';
import { formatNaira } from '@/lib/format';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { primaryImageUrl } from '@/lib/types/product';
import type { CartItem } from '@/lib/types/cart';
import { removeCartItemAction, updateCartItemAction } from './actions';
import styles from './page.module.css';

export function CartItemRow({ item }: { item: CartItem }) {
  const [isPending, startTransition] = useTransition();

  const updateQuantity = (quantity: number) => {
    startTransition(() => {
      updateCartItemAction(item.id, quantity);
    });
  };

  const remove = () => {
    startTransition(() => {
      removeCartItemAction(item.id);
    });
  };

  const imageUrl = primaryImageUrl(item.product) ?? '/assets/images/products/sony-headphones.png';
  const isInvalid = item.quantity > item.product.stock;

  return (
    <article className={styles.item} style={{ opacity: isPending ? 0.6 : 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={item.product.name} className={styles.itemImage} />
      <div className={styles.itemBody}>
        <p className={styles.itemName}>{item.product.name}</p>
        <p className={styles.itemUnitPrice}>{formatNaira(item.product_price)} each</p>
        {isInvalid && <p className={styles.invalidTag}>Only {item.product.stock} left — update quantity</p>}
        <div className={styles.itemFooter}>
          <div className={styles.qtyControl}>
            <button type="button" className={styles.qtyBtn} onClick={() => updateQuantity(item.quantity - 1)} disabled={isPending}>
              <Minus size={12} />
            </button>
            <span className={styles.qtyValue}>{item.quantity}</span>
            <button
              type="button"
              className={styles.qtyBtn}
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={isPending || item.quantity >= item.product.stock}
            >
              <Plus size={12} />
            </button>
          </div>
          <span className={styles.itemSubtotal}>{formatNaira((item.product_price * item.quantity))}</span>
        </div>
        <button type="button" className={styles.removeBtn} onClick={remove} disabled={isPending}>
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </article>
  );
}
