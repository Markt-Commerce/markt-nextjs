'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MailCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { forgotPasswordAction, resetPasswordAction, type FormState } from '../actions';
import styles from './forgot-password.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

type Step = 'request' | 'confirm' | 'done';

export function ResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />

        {step === 'request' && (
          <RequestStep
            email={email}
            setEmail={setEmail}
            onSent={() => setStep('confirm')}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            email={email}
            onDone={() => setStep('done')}
            onBack={() => setStep('request')}
          />
        )}

        {step === 'done' && <DoneStep onContinue={() => router.push('/auth/login')} />}

        {step !== 'done' && (
          <p className={styles.footer}>
            Remembered it? <Link href="/auth/login">Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

// --- Step 1: ask for the email, trigger the reset code ---
function RequestStep({ email, setEmail, onSent }: { email: string; setEmail: (v: string) => void; onSent: () => void }) {
  const [error, setError] = useState('');
  // Only shown when the backend rejects the reset because this email isn't
  // verified — most people never see it.
  const [needsVerify, setNeedsVerify] = useState(false);
  const [pending, startTransition] = useTransition();
  const valid = EMAIL_PATTERN.test(email.trim());

  const submit = () => {
    setError('');
    setNeedsVerify(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', email.trim());
      const result: FormState = await forgotPasswordAction({}, fd);
      if (result.success) {
        onSent();
        return;
      }
      setError(result.error ?? 'Something went wrong. Please try again.');
      setNeedsVerify(Boolean(result.needsVerification));
    });
  };

  return (
    <form
      className={styles.step}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !pending) submit();
      }}
    >
      <div className={styles.iconBadge}>
        <KeyRound size={24} />
      </div>
      <h1 className={styles.heading}>Reset your password</h1>
      <p className={styles.sub}>Enter the email on your account and we&apos;ll send a 6-digit reset code.</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">Email</label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}><Mail size={16} /></span>
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
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {needsVerify && (
        <Link href={`/auth/verify-email?email=${encodeURIComponent(email.trim())}`} className={styles.verifyLink}>
          <MailCheck size={15} /> Verify your email first <ArrowRight size={14} className={styles.arrow} />
        </Link>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn} disabled={!valid || pending}>
          {pending ? (
            <><Loader2 size={16} className="animate-spin" /> Sending…</>
          ) : (
            <>Send reset code <ArrowRight size={16} className={styles.arrow} /></>
          )}
        </button>
      </div>
    </form>
  );
}

// --- Step 2: enter the 6-digit code + a new password ---
function ConfirmStep({ email, onDone, onBack }: { email: string; onDone: () => void; onBack: () => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [resending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const code = digits.join('');
  const passwordValid = PASSWORD_PATTERN.test(password);
  const canSubmit = code.length === 6 && passwordValid;

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Paste of the whole code into one box.
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('');
      const filled = ['', '', '', '', '', ''].map((_, i) => next[i] ?? '');
      setDigits(filled);
      inputsRef.current[Math.min(next.length, 6) - 1]?.focus();
      return;
    }
    setDigits((d) => d.map((x, i) => (i === index ? clean : x)));
    if (index < 5) inputsRef.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const submit = () => {
    setError('');
    startTransition(async () => {
      const result = await resetPasswordAction(email, code, password);
      if (result.ok) onDone();
      else setError(result.error ?? 'Could not reset your password. Please try again.');
    });
  };

  const resend = () => {
    if (cooldown > 0 || resending) return;
    startResend(async () => {
      const fd = new FormData();
      fd.set('email', email);
      await forgotPasswordAction({}, fd);
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
    <form
      className={styles.step}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !pending) submit();
      }}
    >
      <div className={cn(styles.iconBadge, styles.iconBadgePulse)}>
        <MailCheck size={24} />
      </div>
      <h1 className={styles.heading}>Enter your code</h1>
      <p className={styles.sub}>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it and choose a new password.
      </p>

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
            autoFocus={i === 0}
          />
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="new-password">New password</label>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}><Lock size={16} /></span>
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            className={cn(styles.input, password.length > 0 && !passwordValid && styles.inputError)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className={styles.hint}>Needs upper &amp; lower case and a number, 8+ characters.</span>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resendRow}>
        Didn&apos;t get it?{' '}
        <button type="button" className={styles.resendBtn} onClick={resend} disabled={cooldown > 0 || resending}>
          {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.backBtn} onClick={onBack} disabled={pending}>
          <ArrowLeft size={15} className={styles.arrowBack} /> Back
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={!canSubmit || pending}>
          {pending ? (
            <><Loader2 size={16} className="animate-spin" /> Resetting…</>
          ) : (
            'Reset password'
          )}
        </button>
      </div>
    </form>
  );
}

// --- Step 3: done ---
function DoneStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.step} style={{ textAlign: 'center' }}>
      <div className={styles.doneBadge}>
        <CheckCircle2 size={32} />
      </div>
      <h1 className={styles.heading}>Password updated</h1>
      <p className={styles.sub}>Your password has been reset. You can now sign in with your new password.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={onContinue}>
          Back to sign in <ArrowRight size={16} className={styles.arrow} />
        </button>
      </div>
    </div>
  );
}
