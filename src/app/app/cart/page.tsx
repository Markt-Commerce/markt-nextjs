import Link from 'next/link';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getCart } from '@/lib/api/cart';
import { safeFetch } from '@/lib/api/safe';
import { cartSubtotal, type Cart } from '@/lib/types/cart';

const EMPTY_CART: Cart = { id: 0, buyer_id: 0, items: [], expires_at: '' };
import { CartItemRow } from './cart-item-row';
import { CouponForm } from './coupon-form';
import styles from './page.module.css';

export default async function CartPage() {
  const user = await requireSession();

  if (user.current_role !== 'buyer') {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>Only buyer accounts have a cart. Switch roles to shop.</div>
      </div>
    );
  }

  const cookie = await getForwardedCookie();
  const cart = await safeFetch(() => getCart(cookie), EMPTY_CART);

  if (cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Cart</h1>
        <div className={styles.emptyState}>
          Your cart is empty. <Link href="/app/marketplace">Browse the marketplace</Link> to find something you like.
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);
  const discount = cart.coupon_code ? subtotal * 0.1 : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cart</h1>

      <div className={styles.layout}>
        <div className={styles.itemList}>
          {cart.items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <aside className={styles.summary}>
          <p className={styles.summaryTitle}>Order Summary</p>

          <CouponForm />

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.tearLine} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${(subtotal - discount).toFixed(2)}</span>
          </div>

          <Link href="/app/checkout" className={styles.checkoutBtn} style={{ marginTop: '1rem' }}>
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
