import 'server-only';
import { apiFetch } from './client';
import type { Cart, CartItem } from '@/lib/types/cart';

export async function getCart(cookie: string | undefined): Promise<Cart> {
  return apiFetch<Cart>('/cart/', { cookie, cache: 'no-store' });
}

export async function addCartItem(productId: string, quantity: number, cookie: string | undefined): Promise<void> {
  await apiFetch('/cart/add', { method: 'POST', cookie, body: { product_id: productId, quantity } });
}

export async function updateCartItem(itemId: number, quantity: number, cookie: string | undefined): Promise<CartItem> {
  return apiFetch<CartItem>(`/cart/items/${itemId}`, { method: 'PUT', cookie, body: { quantity } });
}

export async function removeCartItem(itemId: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE', cookie });
}

export async function applyCoupon(code: string, cookie: string | undefined): Promise<{ message?: string }> {
  return apiFetch<{ message?: string }>('/cart/coupon', { method: 'POST', cookie, body: { coupon_code: code } });
}

export interface CheckoutAddress {
  recipient_name: string;
  phone_number?: string;
  street: string;
  house_number: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

export interface CheckoutResponse {
  order_id: string;
  order_number: string | null;
  status: string;
  subtotal: number;
  shipping_fee: number;
  tax: number;
  discount: number;
  total: number;
}

export async function checkoutCart(
  shippingAddress: CheckoutAddress,
  billingAddress: CheckoutAddress,
  notes: string | undefined,
  cookie: string | undefined
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>('/cart/checkout', {
    method: 'POST',
    cookie,
    body: { shipping_address: shippingAddress, billing_address: billingAddress, notes },
  });
}
