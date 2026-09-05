'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { loginAction, type FormState } from '../actions';
import styles from './login.module.css';

const initialState: FormState = {};

// Real-feeling testimonials for the quote panel, each backed by a lifestyle
// photo so the panel reads as human rather than a decorative gradient. Kept
// in-file (no network) so the panel always renders.
const TESTIMONIALS = [
  {
    quote: 'I found my favourite ceramics studio three streets away — through a post, not an ad. That’s the whole point of Markt.',
    name: 'Amara O.',
    meta: 'Buyer · Lagos',
    image:
      '/assets/landing/african-female-happily-shopping-online-using-laptop-smartphone-while-holding-her-credit-card.jpg',
  },
  {
    quote: 'Sold out my weekend bakes before Saturday even started. My customers actually follow me now.',
    name: 'Daniel K.',
    meta: 'Seller · Accra',
    image: '/assets/landing/person-setting-up-online-store-uploading-products-laptop.jpg',
  },
  {
    quote: 'It feels less like a shop and more like a neighbourhood. I discover people first, then the things they make.',
    name: 'Priya R.',
    meta: 'Buyer · Nairobi',
    image:
      '/assets/landing/beautiful-three-welldressed-afro-american-girls-with-colored-shopping-bags-walking-mall.jpg',
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
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
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
    const id = setInterval(() => setActive((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const go = (dir: number) => setActive((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  const t = TESTIMONIALS[active];

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {/* ---------- Form ---------- */}
        <section className={styles.formPane}>
          <div className={styles.formInner}>
          <div className={styles.brandRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/markt-text-logo.png" alt="Markt" className={styles.logo} />
          </div>

          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.sub}>Sign in to pick up where you left off.</p>

          <div className={styles.roleToggle} role="tablist" aria-label="Sign in as">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'buyer'}
              className={cn(styles.rolePill, role === 'buyer' && styles.rolePillActive)}
              onClick={() => setRole('buyer')}
            >
              I&apos;m buying
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'seller'}
              className={cn(styles.rolePill, role === 'seller' && styles.rolePillActive)}
              onClick={() => setRole('seller')}
            >
              I&apos;m selling
            </button>
          </div>

          <form action={formAction} className={styles.form}>
            <input type="hidden" name="returnUrl" value={returnUrl ?? ''} />
            <input type="hidden" name="role" value={role} />

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
          </div>
        </section>

        {/* ---------- Quote panel: lifestyle photo + rotating human quote ---------- */}
        <aside className={styles.quotePane}>
          {TESTIMONIALS.map((item, i) => (
            <div
              key={i}
              className={cn(styles.quoteBg, i === active && styles.quoteBgActive)}
              style={{ backgroundImage: `url(${item.image})` }}
              aria-hidden
            />
          ))}
          <div className={styles.quoteScrim} aria-hidden />

          <div className={styles.paneHeader}>Shopping, the way it connects us</div>

          <div className={styles.quoteBody}>
            {/* key forces the crossfade animation to replay on each rotation */}
            <p key={active} className={styles.quoteText}>&ldquo;{t.quote}&rdquo;</p>
            <div key={`a-${active}`} className={styles.author}>
              <span className={styles.avatar}>{initials(t.name)}</span>
              <span className={styles.authorText}>
                <span className={styles.authorName}>{t.name}</span>
                <span className={styles.authorMeta}><MapPin size={11} /> {t.meta}</span>
              </span>
            </div>

            <div className={styles.controls}>
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
              <div className={styles.arrows}>
                <button type="button" className={styles.navArrow} onClick={() => go(-1)} aria-label="Previous testimonial">
                  <ArrowLeft size={16} />
                </button>
                <button type="button" className={styles.navArrow} onClick={() => go(1)} aria-label="Next testimonial">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
