'use client';

import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { verifyEmailAction, resendVerificationAction } from '../actions';
import styles from './verify-email.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email') ?? '';
  const urlCode = searchParams.get('code') ?? '';

  const [email, setEmail] = useState(urlEmail);
  const [digits, setDigits] = useState<string[]>(() => {
    // Prefill the boxes if a 6-digit code arrived in the link.
    const seed = urlCode.replace(/\D/g, '').slice(0, 6);
    return ['', '', '', '', '', ''].map((_, i) => seed[i] ?? '');
  });
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [verifying, startVerify] = useTransition();
  const [resending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const autoRan = useRef(false);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const code = digits.join('');
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const canSubmit = emailValid && code.length === 6;

  const submit = (fullCode: string, targetEmail: string) => {
    setError('');
    startVerify(async () => {
      const result = await verifyEmailAction(targetEmail.trim(), fullCode);
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error ?? 'That code didn’t work. Try again.');
        setDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    });
  };

  // Auto-verify once if the link carried both email and a full code. Deferred
  // to a timeout so the setState in submit() doesn't run synchronously inside
  // the effect (which would trigger a cascading render).
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    if (EMAIL_PATTERN.test(urlEmail.trim()) && urlCode.replace(/\D/g, '').length === 6) {
      const t = setTimeout(() => submit(urlCode.replace(/\D/g, '').slice(0, 6), urlEmail), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('');
      const filled = ['', '', '', '', '', ''].map((_, i) => next[i] ?? '');
      setDigits(filled);
      inputsRef.current[Math.min(next.length, 6) - 1]?.focus();
      if (filled.every((x) => x) && emailValid) submit(filled.join(''), email);
      return;
    }
    const nextDigits = digits.map((x, i) => (i === index ? clean : x));
    setDigits(nextDigits);
    if (index < 5) inputsRef.current[index + 1]?.focus();
    if (nextDigits.every((x) => x) && emailValid) submit(nextDigits.join(''), email);
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const resend = () => {
    if (!emailValid || cooldown > 0 || resending) return;
    setError('');
    startResend(async () => {
      const result = await resendVerificationAction(email.trim());
      if (!result.ok) {
        setError(result.error ?? 'Could not resend the code.');
        return;
      }
      setCooldown(45);
      cooldownRef.current = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />

        {done ? (
          <>
            <div className={cn(styles.iconBadge, styles.iconBadgeSuccess)}>
              <CheckCircle2 size={26} />
            </div>
            <h1 className={styles.heading}>Email verified</h1>
            <p className={styles.sub}>Welcome to Markt! Your account is now active — sign in to get started.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryBtn} onClick={() => router.push('/auth/login')}>
                Continue to sign in <ArrowRight size={16} className={styles.arrow} />
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit && !verifying) submit(code, email);
            }}
          >
            <div className={cn(styles.iconBadge, styles.iconBadgePulse)}>
              <MailCheck size={26} />
            </div>
            <h1 className={styles.heading}>Verify your email</h1>
            <p className={styles.sub}>
              {emailValid ? (
                <>Enter the 6-digit code we sent to <strong>{email.trim()}</strong>.</>
              ) : (
                <>Enter your email and the 6-digit code we sent you.</>
              )}
            </p>

            {/* Only ask for the email when the link didn't already carry a valid one. */}
            {!EMAIL_PATTERN.test(urlEmail.trim()) && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            )}

            <div className={styles.codeRow}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  className={cn(styles.codeBox, digit && styles.codeBoxFilled)}
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  autoFocus={EMAIL_PATTERN.test(urlEmail.trim()) && i === 0}
                />
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.resendRow}>
              Didn&apos;t get it?{' '}
              <button type="button" className={styles.resendBtn} onClick={resend} disabled={!emailValid || cooldown > 0 || resending}>
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn} disabled={!canSubmit || verifying}>
                {verifying ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                ) : (
                  <>Verify email <ArrowRight size={16} className={styles.arrow} /></>
                )}
              </button>
              <Link href="/auth/login" className={styles.ghostBtn}>Back to sign in</Link>
            </div>
          </form>
        )}

        <p className={styles.support}>
          <a href="mailto:support@marktcommerce.com">Need help? Contact support</a>
        </p>
      </div>
    </div>
  );
}
