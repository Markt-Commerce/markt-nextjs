import { apiFetch } from './client';

// Wallet / billing. These endpoints appeared in the API after the initial
// rewrite (the wallet domain is now live): balance, transaction history,
// Paystack top-up/withdraw, and seller payout accounts.

export interface WalletBalance {
  available_balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string;
  reference_id: string;
  created_at: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  pagination: Record<string, unknown>;
}

export async function getWalletBalance(cookie?: string): Promise<WalletBalance> {
  return apiFetch<WalletBalance>('/wallet/', { cookie, cache: 'no-store' });
}

export async function getWalletTransactions(
  cookie?: string,
  opts: { page?: number; perPage?: number } = {}
): Promise<WalletTransactionsResponse> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.perPage) params.set('per_page', String(opts.perPage));
  const qs = params.toString();
  return apiFetch<WalletTransactionsResponse>(`/wallet/transactions${qs ? `?${qs}` : ''}`, {
    cookie,
    cache: 'no-store',
  });
}
