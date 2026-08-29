import type { Product } from './product';

export interface CartItem {
  id: number;
  product_id: string;
  product: Product;
  variant_id?: number | null;
  quantity: number;
  product_price: number;
}

export interface Cart {
  id: number;
  buyer_id: number;
  items: CartItem[];
  coupon_code?: string | null;
  expires_at: string;
  subtotal?: number;
  total_items?: number;
}

export interface CartSummary {
  item_count: number;
  subtotal: number;
  discount: number;
  total: number;
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
}

export function cartTotalItems(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
