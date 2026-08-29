'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { addCartItem, applyCoupon, checkoutCart, removeCartItem, updateCartItem, type CheckoutAddress } from '@/lib/api/cart';
import { getForwardedCookie } from '@/lib/api/session';

export interface CartActionState {
  error?: string;
  success?: boolean;
  message?: string;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? `${err.message} (${err.status})` : fallback;
}

// Used by the product detail page's Add to Cart / Buy Now, and the cart
// page's own line items.
export async function addToCartAction(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get('product_id') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);
  const redirectTo = String(formData.get('redirectTo') ?? '');

  if (!productId || !Number.isFinite(quantity) || quantity < 1) {
    return { error: 'Invalid product or quantity.' };
  }

  try {
    await addCartItem(productId, quantity, await getForwardedCookie());
  } catch (err) {
    return { error: errorMessage(err, 'Could not add to cart.') };
  }

  // So the app shell's cart badge (already wired to the real API) reflects
  // the new count immediately.
  revalidatePath('/app', 'layout');

  if (redirectTo) redirect(redirectTo);
  return { success: true };
}

export async function updateCartItemAction(itemId: number, quantity: number): Promise<CartActionState> {
  if (quantity < 0) return { error: 'Quantity cannot be negative.' };

  try {
    if (quantity === 0) {
      await removeCartItem(itemId, await getForwardedCookie());
    } else {
      await updateCartItem(itemId, quantity, await getForwardedCookie());
    }
  } catch (err) {
    return { error: errorMessage(err, 'Could not update cart.') };
  }

  revalidatePath('/app/cart');
  revalidatePath('/app', 'layout');
  return { success: true };
}

export async function removeCartItemAction(itemId: number): Promise<CartActionState> {
  try {
    await removeCartItem(itemId, await getForwardedCookie());
  } catch (err) {
    return { error: errorMessage(err, 'Could not remove item.') };
  }

  revalidatePath('/app/cart');
  revalidatePath('/app', 'layout');
  return { success: true };
}

export async function applyCouponAction(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const code = String(formData.get('code') ?? '').trim();
  if (!code) return { error: 'Enter a coupon code.' };

  try {
    const res = await applyCoupon(code, await getForwardedCookie());
    revalidatePath('/app/cart');
    return { success: true, message: res.message ?? 'Coupon applied' };
  } catch (err) {
    return { error: errorMessage(err, 'Invalid or expired coupon code.') };
  }
}

export interface CheckoutActionState {
  error?: string;
}

function addressFromForm(formData: FormData, prefix: string): CheckoutAddress {
  return {
    street: String(formData.get(`${prefix}_street`) ?? ''),
    house_number: String(formData.get(`${prefix}_house_number`) ?? ''),
    city: String(formData.get(`${prefix}_city`) ?? ''),
    state: String(formData.get(`${prefix}_state`) ?? ''),
    country: String(formData.get(`${prefix}_country`) ?? ''),
    postal_code: String(formData.get(`${prefix}_postal_code`) ?? ''),
  };
}

export async function checkoutAction(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const shipping = addressFromForm(formData, 'shipping');
  const billingSameAsShipping = formData.get('billing_same') === 'on';
  const billing = billingSameAsShipping ? shipping : addressFromForm(formData, 'billing');
  const notes = String(formData.get('notes') ?? '').trim() || undefined;

  const isComplete = (a: CheckoutAddress) => Object.values(a).every((v) => v.trim().length > 0);
  if (!isComplete(shipping) || !isComplete(billing)) {
    return { error: 'Please fill in the full address.' };
  }

  let orderId: string;
  try {
    const res = await checkoutCart(shipping, billing, notes, await getForwardedCookie());
    orderId = res.order_id;
  } catch (err) {
    return { error: errorMessage(err, 'Could not place order.') };
  }

  revalidatePath('/app', 'layout');
  redirect(`/app/checkout/confirmation/${orderId}`);
}
