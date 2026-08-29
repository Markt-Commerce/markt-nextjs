import Link from 'next/link';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getCart } from '@/lib/api/cart';
import { safeFetch } from '@/lib/api/safe';
import { cartSubtotal, type Cart } from '@/lib/types/cart';
import { CheckoutForm } from './checkout-form';
import styles from './page.module.css';

const EMPTY_CART: Cart = { id: 0, buyer_id: 0, items: [], expires_at: '' };

export default async function CheckoutPage() {
  const user = await requireSession();

  if (user.current_role !== 'buyer') {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>Only buyer accounts can check out.</div>
      </div>
    );
  }

  const cookie = await getForwardedCookie();
  const cart = await safeFetch(() => getCart(cookie), EMPTY_CART);

  if (cart.items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          Your cart is empty. <Link href="/app/marketplace">Browse the marketplace</Link> first.
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);
  const discount = cart.coupon_code ? subtotal * 0.1 : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>
      <CheckoutForm cart={cart} subtotal={subtotal} discount={discount} />
    </div>
  );
}
