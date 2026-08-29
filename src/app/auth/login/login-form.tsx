'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, Star, Loader2 } from 'lucide-react';
import { loginAction, mockLoginAction, type FormState } from '../actions';

const initialState: FormState = {};

export function LoginForm({ returnUrl }: { returnUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  // Server Actions run server-side, so a failure never reaches the browser
  // console on its own — the full error (status + body) is already logged
  // server-side by lib/api/client.ts; this mirrors just the message here so
  // it's visible in the browser devtools console too, not just the form.
  useEffect(() => {
    if (state.error) console.error('[login]', state.error);
  }, [state.error]);

  return (
    <main className="min-h-screen flex font-sans bg-light">
      <section className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/60 to-dark/40 z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="w-full h-full object-cover"
          src="https://storage.googleapis.com/uxpilot-auth.appspot.com/e5bd52eb93-f7b7d497391e6b30c9df.png"
          alt="modern university campus with students using laptops and tablets"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-16">
          <div className="max-w-lg">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">MARKT</h1>
              <div className="w-12 h-1 bg-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 leading-tight">Your Campus Marketplace Awaits</h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Connect with your campus community. Buy, sell, and discover amazing products from fellow students and
              local businesses.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-white/80">
                <ShieldCheck size={16} className="text-primary mr-2" />
                <span className="text-sm">Verified Students</span>
              </div>
              <div className="flex items-center text-white/80">
                <Users size={16} className="text-primary mr-2" />
                <span className="text-sm">Campus Community</span>
              </div>
              <div className="flex items-center text-white/80">
                <Star size={16} className="text-primary mr-2" />
                <span className="text-sm">Trusted Platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">MARKT</h1>
            <div className="w-12 h-1 bg-primary mx-auto" />
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-dark mb-2">Welcome Back</h2>
            <p className="text-muted">Sign in to your account to continue</p>
          </div>

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="returnUrl" value={returnUrl ?? ''} />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} className="text-muted" /> : <Eye size={16} className="text-muted" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-secondary transition-colors">
                Forgot password?
              </Link>
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending && <Loader2 size={16} className="animate-spin mr-2" />}
              {pending ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-sm text-muted">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:text-secondary font-medium transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-900">Real login is temporarily broken</p>
            <p className="mt-1 text-amber-800">
              The backend has a known bug (missing database column) that 500s every login/register attempt — not
              something fixable from this app. Use a mock session to test the rest of the app in the meantime.
            </p>
            <form action={mockLoginAction} className="mt-3 flex gap-2">
              <button
                type="submit"
                name="role"
                value="buyer"
                className="flex-1 rounded-md border border-amber-300 bg-white py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                Continue as mock buyer
              </button>
              <button
                type="submit"
                name="role"
                value="seller"
                className="flex-1 rounded-md border border-amber-300 bg-white py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                Continue as mock seller
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center space-x-6 text-xs text-muted">
              <div className="flex items-center">
                <ShieldCheck size={14} className="text-green-500 mr-1" /> SSL Encrypted
              </div>
              <div className="flex items-center">
                <Lock size={14} className="text-green-500 mr-1" /> Secure Login
              </div>
              <div className="flex items-center">
                <Users size={14} className="text-primary mr-1" /> Campus Verified
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
