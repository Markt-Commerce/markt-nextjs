export type OrderStatus =
  | 'pending_payment'
  | 'ready_for_delivery'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'failed';

// The real API's OrderItem is deliberately thin — no product name/image
// inline. Showing those requires a separate GET /products/{id} per item
// (done on the order detail page; skipped on the list page as N+1-per-row).
export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  variant_id?: number;
  seller_id?: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface BuyerOrder {
  id: string;
  order_number: string;
  cart_id: number;
  payment_method: string;
  status: OrderStatus;
  items: OrderItem[];
  shipping_address?: Record<string, unknown>;
  subtotal: number;
  customer_note?: string;
  created_at: string;
}

export interface Order extends BuyerOrder {
  seller_id?: number;
  buyer_id?: number;
  shipping_fee: number;
  tax: number;
  discount: number;
  total: number;
}

export interface Tracking {
  order_id: string;
  order_number?: string | null;
  status: string;
  timeline: Record<string, unknown>[];
  shipping_address?: Record<string, unknown> | null;
}

export function orderTotal(order: BuyerOrder | Order): number {
  return 'total' in order && order.total !== undefined ? order.total : order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function orderTotalItems(order: BuyerOrder): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
