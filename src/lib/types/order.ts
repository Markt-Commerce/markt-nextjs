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

// ---- Delivery tracking (mirrors mobile models/orders.ts for parity) ----

export interface TrackingTimelineEntry {
  status: string;
  label: string;
  timestamp: string | null;
}

export interface TrackingItem {
  id: number;
  product_id: string;
  quantity: number;
  status: string;
  seller_id: number;
}

export interface TrackingShipment {
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

/** The person bringing it, as the tracking endpoint returns them. */
export interface TrackingRider {
  name: string | null;
  phone_number: string | null;
  profile_picture: string | null;
  vehicle_type: string | null;
  rating: number | null;
}

export interface TrackingDelivery {
  assignment_id: string;
  status: string;
  /** Raw rider step: ARRIVED_PICKUP | PICKED_UP | EN_ROUTE_TO_DROPOFF |
   *  DELIVERED_PENDING_QR | COMPLETED. Null before a rider has started. */
  logistical_status: string | null;
  assigned_at: string | null;
  /** Null before a rider is found, and on orders placed before riders carried
   *  identities. */
  rider?: TrackingRider | null;
}

export interface Tracking {
  order_id: string;
  order_number?: string | null;
  status: string;
  timeline: TrackingTimelineEntry[];
  shipping_address?: Record<string, unknown> | null;
  items?: TrackingItem[];
  shipment?: TrackingShipment | null;
  delivery?: TrackingDelivery | null;
}

/** The buyer's proof-of-delivery code — shown to the rider to confirm receipt. */
export interface PodCode {
  ready: boolean;
  system: 'single_order' | 'run' | null;
  code: string | null;
  /** The code has been used and the delivery is over — distinct from `ready:
   *  false`, which means there's no code *yet*. Optional: older backends omit it. */
  delivered?: boolean;
}

/** A delivery still moving is worth polling; a completed one will not change. */
export function deliveryInFlight(delivery?: TrackingDelivery | null): boolean {
  if (!delivery) return false;
  return delivery.logistical_status !== 'COMPLETED';
}

/** Whether to offer "View my delivery code" at all. */
export function hasLiveDeliveryCode(pod?: PodCode | null): boolean {
  return !!pod?.ready && !pod?.delivered;
}

export function orderTotal(order: BuyerOrder | Order): number {
  return 'total' in order && order.total !== undefined ? order.total : order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function orderTotalItems(order: BuyerOrder): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
