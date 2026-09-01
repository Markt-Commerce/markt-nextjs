'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2, ShoppingBag, Store, X, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/cn';
import { checkUsernameAction, verifyEmailAction, resendVerificationAction } from '../actions';
import { submitRegistrationAction } from './actions';
import styles from './register.module.css';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 1 | 2 | 3 | 'done';
type AccountType = 'buyer' | 'seller';

interface FormData {
  account_type: AccountType;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone_number: string;
  terms: boolean;
}
type Setter = <K extends keyof FormData>(key: K, value: FormData[K]) => void;

const STEP_NAMES: Record<Exclude<Step, 'done'>, string> = { 1: 'Account', 2: 'Secure it', 3: 'Verify' };

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({
    account_type: 'buyer',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    terms: false,
  });
  const set: Setter = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  // --- Step 1 validation + username availability ---
  const [availability, setAvailability] = useState<{ checking: boolean; available: boolean | null }>({ checking: false, available: null });

  useEffect(() => {
    const value = form.username.trim();
    const checkable = value.length >= 3 && value.length <= 20 && USERNAME_PATTERN.test(value);
    let cancelled = false;

    // All state updates live inside the debounce timeout, never synchronously
    // in the effect body — keeps this off the set-state-in-effect path.
    const handle = setTimeout(() => {
      if (!checkable) {
        setAvailability({ checking: false, available: null });
        return;
      }
      setAvailability({ checking: true, available: null });
      checkUsernameAction(value).then((res) => {
        if (!cancelled) setAvailability({ checking: false, available: res.available });
      });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [form.username]);

  const step1Valid =
    form.username.trim().length >= 3 &&
    form.username.trim().length <= 20 &&
    USERNAME_PATTERN.test(form.username.trim()) &&
    availability.available !== false &&
    EMAIL_PATTERN.test(form.email.trim());

  const passwordValid = PASSWORD_PATTERN.test(form.password);
  const step2Valid = passwordValid && form.password === form.confirmPassword && form.terms;

  const submitRegistration = () => {
    setError('');
    startTransition(async () => {
      const result = await submitRegistrationAction({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        phone_number: form.phone_number.trim() || undefined,
        account_type: form.account_type,
      });
      if (result.ok) setStep(3);
      else setError(result.error ?? 'Something went wrong.');
    });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon.png" alt="Markt" className={styles.logo} />

        <Progress step={step} />

        {step === 1 && (
          <StepAccount
            form={form}
            set={set}
            availability={availability}
            canContinue={step1Valid}
            onContinue={() => {
              setError('');
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StepSecure
            form={form}
            set={set}
            passwordValid={passwordValid}
            canContinue={step2Valid}
            pending={pending}
            error={error}
            onBack={() => {
              setError('');
              setStep(1);
            }}
            onSubmit={submitRegistration}
          />
        )}

        {step === 3 && (
          <StepVerify email={form.email.trim()} onVerified={() => setStep('done')} />
        )}

        {step === 'done' && <StepDone onContinue={() => router.push('/app/dashboard')} />}

        {step !== 'done' && (
          <p className={styles.footer}>
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const index = step === 'done' ? 3 : step; // done fills all
  return (
    <>
      <div className={styles.progress}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(styles.segment, index > n && styles.segmentDone, index === n && styles.segmentCurrent)}
          >
            <span className={styles.segmentFill} />
          </span>
        ))}
      </div>
      {step !== 'done' && (
        <div className={styles.stepMeta}>
          <span className={styles.stepCount}>Step {step} of 3</span>
          <span className={styles.stepName}>{STEP_NAMES[step]}</span>
        </div>
      )}
    </>
  );
}

// --- Step 1: who you are ---
function StepAccount({
  form,
  set,
  availability,
  canContinue,
  onContinue,
}: {
  form: FormData;
  set: Setter;
  availability: { checking: boolean; available: boolean | null };
  canContinue: boolean;
  onContinue: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <h1 className={styles.heading}>Join Markt</h1>
      <p className={styles.sub}>First, how do you want to start? You can add the other role anytime.</p>

      <div className={styles.roleGrid}>
        <RoleCard
          active={form.account_type === 'buyer'}
          icon={<ShoppingBag size={17} />}
          name="I'm buying"
          desc="Discover and shop from local sellers."
          onClick={() => set('account_type', 'buyer')}
        />
        <RoleCard
          active={form.account_type === 'seller'}
          icon={<Store size={17} />}
          name="I'm selling"
          desc="List products and reach buyers near you."
          onClick={() => set('account_type', 'seller')}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className={styles.input}
          value={form.username}
          onChange={(e) => set('username', e.target.value)}
          placeholder="yourname"
          autoComplete="username"
          minLength={3}
          maxLength={20}
        />
        {availability.checking && (
          <span className={`${styles.availability} ${styles.availChecking}`}>
            <Loader2 size={12} className="animate-spin" /> Checking…
          </span>
        )}
        {!availability.checking && availability.available === true && (
          <span className={`${styles.availability} ${styles.availOk}`}>
            <Check size={12} /> Available
          </span>
        )}
        {!availability.checking && availability.available === false && (
          <span className={`${styles.availability} ${styles.availNo}`}>
            <X size={12} /> Already taken
          </span>
        )}
        {availability.available === null && !availability.checking && (
          <span className={styles.hint}>Letters, numbers and underscores. 3–20 characters.</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={styles.input}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn} disabled={!canContinue}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

function RoleCard({
  active,
  icon,
  name,
  desc,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  name: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn(styles.roleCard, active && styles.roleCardActive)} onClick={onClick} aria-pressed={active}>
      <span className={styles.roleIcon}>{icon}</span>
      <p className={styles.roleName}>{name}</p>
      <p className={styles.roleDesc}>{desc}</p>
    </button>
  );
}

// --- Step 2: secure it ---
function StepSecure({
  form,
  set,
  passwordValid,
  canContinue,
  pending,
  error,
  onBack,
  onSubmit,
}: {
  form: FormData;
  set: Setter;
  passwordValid: boolean;
  canContinue: boolean;
  pending: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const mismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onSubmit();
      }}
    >
      <h1 className={styles.heading}>Secure your account</h1>
      <p className={styles.sub}>Pick a strong password so only you get in.</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className={cn(styles.input, form.password.length > 0 && !passwordValid && styles.inputError)}
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <span className={styles.hint}>Needs upper &amp; lower case and a number, 8+ characters.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={cn(styles.input, mismatch && styles.inputError)}
          value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          autoComplete="new-password"
        />
        {mismatch && <span className={styles.fieldError}>Passwords don&apos;t match.</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone_number">
          Phone number <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="phone_number"
          type="tel"
          className={styles.input}
          value={form.phone_number}
          onChange={(e) => set('phone_number', e.target.value)}
          autoComplete="tel"
          placeholder="+1234567890"
        />
      </div>

      <div className={styles.terms}>
        <input id="terms" type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} />
        <label htmlFor="terms">
          I agree to the <Link href="/legal/terms">Terms of Service</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.backBtn} onClick={onBack} disabled={pending}>
          <ArrowLeft size={15} /> Back
        </button>
        <button type="submit" className={styles.primaryBtn} disabled={!canContinue || pending}>
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </div>
    </form>
  );
}

// --- Step 3: verify code ---
function StepVerify({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState('');
  const [verifying, startVerify] = useTransition();
  const [resending, startResend] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const code = digits.join('');

  const submit = (fullCode: string) => {
    setError('');
    startVerify(async () => {
      const result = await verifyEmailAction(email, fullCode);
      if (result.ok) onVerified();
      else {
        setError(result.error ?? 'That code didn’t work. Try again.');
        setDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    });
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((x, i) => (i === index ? '' : x)));
      return;
    }
    // Handle paste of the whole code into one box.
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('');
      const filled = ['', '', '', '', '', ''].map((_, i) => next[i] ?? '');
      setDigits(filled);
      const lastIndex = Math.min(next.length, 6) - 1;
      inputsRef.current[lastIndex]?.focus();
      if (filled.every((x) => x)) submit(filled.join(''));
      return;
    }
    const nextDigits = digits.map((x, i) => (i === index ? clean : x));
    setDigits(nextDigits);
    if (index < 5) inputsRef.current[index + 1]?.focus();
    if (nextDigits.every((x) => x)) submit(nextDigits.join(''));
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const resend = () => {
    if (cooldown > 0 || resending) return;
    startResend(async () => {
      await resendVerificationAction(email);
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
    <div>
      <h1 className={styles.heading}>Check your email</h1>
      <p className={styles.sub}>
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to confirm it&apos;s you.
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

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resendRow}>
        Didn&apos;t get it?{' '}
        <button type="button" className={styles.resendBtn} onClick={resend} disabled={cooldown > 0 || resending}>
          {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={() => submit(code)} disabled={code.length !== 6 || verifying}>
          {verifying ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verifying…
            </>
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
}

// --- Done ---
function StepDone({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.doneWrap}>
      <div className={styles.doneBadge}>
        <PartyPopper size={30} />
      </div>
      <h1 className={styles.heading}>You&apos;re all set</h1>
      <p className={styles.sub}>Your email is verified and your account is ready. Welcome to Markt.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={onContinue}>
          Enter Markt <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
