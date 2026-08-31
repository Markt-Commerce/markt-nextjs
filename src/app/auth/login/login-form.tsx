'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { loginAction, mockLoginAction, type FormState } from '../actions';
import styles from './login.module.css';

const initialState: FormState = {};

// Warm, on-brand testimonials for the quote panel. Kept in-file (no network)
// so the panel renders even while the backend login is down.
const TESTIMONIALS = [
  {
    quote: 'I found my favourite ceramics studio three streets away — through a post, not an ad. That’s the whole point of Markt.',
    name: 'Amara O.',
    meta: 'Buyer · Lagos',
    tile: 'var(--tile-butter)',
  },
  {
    quote: 'Sold out my weekend bakes before Saturday even started. My customers actually follow me now.',
    name: 'Daniel K.',
    meta: 'Seller · Accra',
    tile: 'var(--tile-mint)',
  },
  {
    quote: 'It feels less like a shop and more like a neighbourhood. I discover people first, then the things they make.',
    name: 'Priya R.',
    meta: 'Buyer · Nairobi',
    tile: 'var(--tile-sky)',
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState(0);
  // Controlled so React's post-action form reset doesn't wipe it — only the
  // (uncontrolled) password field clears on a failed sign-in attempt.
  const [email, setEmail] = useState('');

  // Server Actions run server-side, so a failure never reaches the browser
  // console on its own — mirror the message here so it's visible in devtools.
  useEffect(() => {
    if (state.error) console.error('[login]', state.error);
  }, [state.error]);

  // Auto-rotate the testimonials.
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(id);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* ---------- Form ---------- */}
        <section className={styles.formPane}>
          <div className={styles.brandRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />
          </div>

          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.sub}>Sign in to pick up where you left off.</p>

          <form action={formAction} className={styles.form}>
            <input type="hidden" name="returnUrl" value={returnUrl ?? ''} />

            <div className={cn(styles.field, styles.reveal, styles.d1)}>
              <label className={styles.label} htmlFor="email">Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={cn(styles.field, styles.reveal, styles.d2)}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Lock size={16} /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={styles.input}
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
            </div>

            <div className={cn(styles.forgotRow, styles.reveal, styles.d3)}>
              <Link href="/auth/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>

            {state.error && <div className={styles.error}>{state.error}</div>}

            <div className={cn(styles.reveal, styles.d4)}>
              <button type="submit" disabled={pending} className={styles.submitBtn}>
                {pending ? 'Signing in…' : (<>Sign in <ArrowRight size={17} className={styles.arrow} /></>)}
              </button>
            </div>

            <p className={styles.signupRow}>
              Don&apos;t have an account? <Link href="/auth/register">Create one</Link>
            </p>
          </form>

          <div className={styles.mock}>
            <p className={styles.mockTitle}>Just exploring?</p>
            <p className={styles.mockText}>
              Skip sign-in with a demo session to click through Markt. (Real accounts must verify their email first.)
            </p>
            <form action={mockLoginAction} className={styles.mockBtns}>
              <button type="submit" name="role" value="buyer" className={styles.mockBtn}>Preview as buyer</button>
              <button type="submit" name="role" value="seller" className={styles.mockBtn}>Preview as seller</button>
            </form>
          </div>

          <div className={styles.trust}>
            <span className={styles.trustItem}><ShieldCheck size={13} /> SSL encrypted</span>
            <span className={styles.trustItem}><Lock size={13} /> Secure sign-in</span>
          </div>
        </section>

        {/* ---------- Quote panel ---------- */}
        <aside className={styles.quotePane}>
          <span className={styles.tile + ' ' + styles.tile1} />
          <span className={styles.tile + ' ' + styles.tile2} />
          <span className={styles.tile + ' ' + styles.tile3} />

          <div className={styles.paneHeader}>
            <Sparkles size={16} /> Shopping, the way it connects us
          </div>

          <div className={styles.quoteBody}>
            <div className={styles.quoteMark} aria-hidden>&ldquo;</div>
            {/* key forces the crossfade animation to replay on each rotation */}
            <p key={active} className={styles.quoteText}>{t.quote}</p>
            <div key={`a-${active}`} className={styles.author}>
              <span className={styles.avatar} style={{ background: t.tile }}>{initials(t.name)}</span>
              <span>
                <span className={styles.authorName}>{t.name}</span>
                <span className={styles.authorMeta} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={11} /> {t.meta}
                </span>
              </span>
            </div>

            <div className={styles.dots}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={cn(styles.dot, i === active && styles.dotActive)}
                  onClick={() => setActive(i)}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.paneStats}>
            <span className={styles.stat}>
              <span className={styles.statNum}>12k+</span>
              <span className={styles.statLabel}>Local sellers</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statNum}>50k+</span>
              <span className={styles.statLabel}>Neighbours shopping</span>
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
