'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowUpFromLine, CheckCircle2 } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { resolveAccountAction, topUpAction, withdrawAction, type WithdrawState } from './wallet-actions';
import type { Bank } from '@/lib/api/wallet';
import styles from './page.module.css';

const initialWithdraw: WithdrawState = {};

export function WalletActions({ banks, available }: { banks: Bank[]; available: number }) {
  const [open, setOpen] = useState<null | 'topup' | 'withdraw'>(null);

  return (
    <div className={styles.walletActions}>
      <div className={styles.walletButtons}>
        <button type="button" className={styles.submitBtn} onClick={() => setOpen(open === 'topup' ? null : 'topup')}>
          <Plus size={15} /> Add money
        </button>
        <button type="button" className={styles.outlineBtn} onClick={() => setOpen(open === 'withdraw' ? null : 'withdraw')}>
          <ArrowUpFromLine size={15} /> Withdraw
        </button>
      </div>

      {open === 'topup' && <TopUpForm />}
      {open === 'withdraw' && <WithdrawForm banks={banks} available={available} />}
    </div>
  );
}

function TopUpForm() {
  const [amount, setAmount] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  const submit = () =>
    start(async () => {
      setError('');
      const res = await topUpAction(Number(amount));
      if (res.url) window.location.href = res.url;
      else setError(res.error ?? 'Could not start the top-up.');
    });

  return (
    <div className={styles.walletForm}>
      <div className={styles.field}>
        <label htmlFor="topup_amount">Amount to add (₦)</label>
        <input
          id="topup_amount"
          className={styles.input}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="5000"
        />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      <button type="button" className={styles.submitBtn} onClick={submit} disabled={pending || !amount}>
        {pending ? 'Starting…' : 'Continue to payment'}
      </button>
    </div>
  );
}

function WithdrawForm({ banks, available }: { banks: Bank[]; available: number }) {
  const [state, formAction, pending] = useActionState(withdrawAction, initialWithdraw);
  const router = useRouter();

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, startResolve] = useTransition();
  const [resolveErr, setResolveErr] = useState('');

  // Refresh the balance + history once a withdrawal is accepted.
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const verify = () =>
    startResolve(async () => {
      setResolveErr('');
      const r = await resolveAccountAction(accountNumber, bankCode);
      if (r.name) setAccountName(r.name);
      else setResolveErr(r.error ?? 'Could not verify that account.');
    });

  if (state.success) {
    return (
      <p className={styles.successText}>
        <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
        Withdrawal requested — it’ll show in your history shortly.
      </p>
    );
  }

  if (banks.length === 0) {
    return <p className={styles.emptyText}>Bank list is unavailable right now — please try again in a moment.</p>;
  }

  return (
    <form action={formAction} className={styles.walletForm}>
      <div className={styles.field}>
        <label htmlFor="bank_code">Bank</label>
        <select
          id="bank_code"
          name="bank_code"
          className={styles.input}
          value={bankCode}
          onChange={(e) => {
            setBankCode(e.target.value);
            setAccountName('');
          }}
          required
        >
          <option value="">Select your bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="account_number">Account number</label>
        <input
          id="account_number"
          name="account_number"
          className={styles.input}
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value);
            setAccountName('');
          }}
          placeholder="0123456789"
          required
        />
      </div>

      <button
        type="button"
        className={styles.outlineBtn}
        onClick={verify}
        disabled={resolving || !bankCode || accountNumber.trim().length < 10}
      >
        {resolving ? 'Verifying…' : 'Verify account'}
      </button>
      {resolveErr && <p className={styles.errorText}>{resolveErr}</p>}

      {accountName && (
        <div className={styles.field}>
          <label htmlFor="account_name">Account name</label>
          <input id="account_name" name="account_name" className={styles.input} value={accountName} readOnly />
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="withdraw_amount">Amount (₦) — {formatNaira(available)} available</label>
        <input id="withdraw_amount" name="amount" className={styles.input} inputMode="decimal" placeholder="5000" required />
      </div>

      {state.error && <p className={styles.errorText}>{state.error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={pending || !accountName}>
        {pending ? 'Requesting…' : 'Withdraw to bank'}
      </button>
    </form>
  );
}
