'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie } from '@/lib/api/session';
import { initializeTopUp, resolveBankAccount, withdrawFromWallet } from '@/lib/api/wallet';

function messageFor(err: unknown, fallback: string): string {
  return err instanceof ApiError ? `${err.message} (${err.status})` : fallback;
}

/** Start a wallet top-up; returns the Paystack URL to send the browser to. */
export async function topUpAction(amount: number): Promise<{ url?: string; error?: string }> {
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount to add.' };
  try {
    const res = await initializeTopUp(amount, await getForwardedCookie());
    if (!res.authorization_url) return { error: 'Could not start the top-up (no payment URL returned).' };
    return { url: res.authorization_url };
  } catch (err) {
    return { error: messageFor(err, 'Could not start the top-up. Please try again.') };
  }
}

/** Look up the account holder's name for a bank + account number. */
export async function resolveAccountAction(
  accountNumber: string,
  bankCode: string
): Promise<{ name?: string; error?: string }> {
  if (!accountNumber || !bankCode) return { error: 'Enter an account number and choose a bank first.' };
  try {
    const res = await resolveBankAccount(accountNumber, bankCode, await getForwardedCookie());
    if (!res.account_name) return { error: 'Couldn’t verify that account. Check the number and bank.' };
    return { name: res.account_name };
  } catch {
    return { error: 'Couldn’t verify that account. Check the number and bank.' };
  }
}

export interface WithdrawState {
  error?: string;
  success?: boolean;
}

/** Request a payout from the wallet to a bank account. */
export async function withdrawAction(_prev: WithdrawState, formData: FormData): Promise<WithdrawState> {
  const amount = Number(formData.get('amount'));
  const bankCode = String(formData.get('bank_code') ?? '');
  const accountNumber = String(formData.get('account_number') ?? '').trim();
  const accountName = String(formData.get('account_name') ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount to withdraw.' };
  if (!bankCode) return { error: 'Choose your bank.' };
  if (!accountNumber) return { error: 'Enter your account number.' };
  if (!accountName) return { error: 'Verify your account so we have the account name.' };

  try {
    await withdrawFromWallet(
      { amount, bank_code: bankCode, account_number: accountNumber, account_name: accountName },
      await getForwardedCookie()
    );
  } catch (err) {
    return { error: messageFor(err, 'Could not request the withdrawal. Please try again.') };
  }

  revalidatePath('/app/settings');
  return { success: true };
}
