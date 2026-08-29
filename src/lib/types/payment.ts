export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_id?: string;
  paid_at?: string;
  created_at: string;
}

export interface PaymentList {
  payments: Payment[];
  page: number;
  per_page: number;
  pages: number;
  total: number;
}

export function formattedAmount(payment: Payment): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency || 'USD' }).format(payment.amount);
}
