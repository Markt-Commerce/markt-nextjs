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

// ---- Top-up (add money via Paystack) & withdraw (payout to a bank) ----

export interface Bank {
  code: string;
  name: string;
  id?: number | null;
  slug?: string | null;
}

export interface TopUpInitializeResponse {
  topup_id?: string;
  authorization_url?: string;
  reference?: string;
  amount?: number;
  currency?: string;
}

export interface Withdrawal {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  created_at: string;
}

/** Start a Paystack top-up — returns an authorization_url to redirect to. */
export async function initializeTopUp(amount: number, cookie?: string): Promise<TopUpInitializeResponse> {
  return apiFetch<TopUpInitializeResponse>('/wallet/topup/initialize', {
    method: 'POST',
    cookie,
    body: { amount, currency: 'NGN', platform: 'web' },
  });
}

/** Banks the user can withdraw to (for the payout bank picker). Never throws. */
export async function listBanks(cookie?: string): Promise<Bank[]> {
  return apiFetch<{ banks: Bank[] }>('/wallet/banks', { cookie, cache: 'no-store' })
    .then((r) => r.banks ?? [])
    .catch(() => []);
}

/** Resolve an account number + bank to the real account name (Paystack lookup). */
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  cookie?: string
): Promise<{ account_name?: string }> {
  const params = new URLSearchParams({ account_number: accountNumber, bank_code: bankCode });
  return apiFetch<{ account_name?: string }>(`/wallet/banks/resolve?${params.toString()}`, { cookie, cache: 'no-store' });
}

/** Request a payout from the wallet to a bank account. */
export async function withdrawFromWallet(
  body: { amount: number; bank_code: string; account_number: string; account_name: string },
  cookie?: string
): Promise<Withdrawal> {
  return apiFetch<Withdrawal>('/wallet/withdraw', { method: 'POST', cookie, body: { ...body, currency: 'NGN' } });
}

/** Recent withdrawals (to show payout status). Never throws. */
export async function listWithdrawals(cookie?: string): Promise<Withdrawal[]> {
  return apiFetch<{ withdrawals: unknown[] }>('/wallet/withdrawals', { cookie, cache: 'no-store' })
    .then((r) => (r.withdrawals as Withdrawal[]) ?? [])
    .catch(() => []);
}
