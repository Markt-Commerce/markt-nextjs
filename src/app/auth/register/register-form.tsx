'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, X, Loader2 } from 'lucide-react';
import { registerAction, checkUsernameAction, type FormState } from '../actions';

const initialState: FormState = {};

// Matches the real API's UserRegister schema constraints exactly.
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

type UsernameStatus = { checking: boolean; available: boolean | null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [accountType, setAccountType] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (state.error) console.error('[register]', state.error);
  }, [state.error]);
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({ checking: false, available: null });

  useEffect(() => {
    const handle = setTimeout(() => {
      const value = username.trim();
      const checkable = value.length >= 3 && value.length <= 20 && USERNAME_PATTERN.test(value);
      if (!checkable) {
        setUsernameStatus({ checking: false, available: null });
        return;
      }

      let cancelled = false;
      setUsernameStatus({ checking: true, available: null });
      checkUsernameAction(value).then((res) => {
        if (!cancelled) setUsernameStatus({ checking: false, available: res.available });
      });
      return () => {
        cancelled = true;
      };
    }, 400);
    return () => clearTimeout(handle);
  }, [username]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/markt-text-logo.png" alt="Markt" className="h-12 w-auto mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Join Markt</h2>
          <p className="mt-2 text-sm text-gray-600">Become part of a vibrant community of buyers and sellers.</p>
          <p className="mt-1 text-xs text-gray-600">
            Choose a starting role below. You can add the other role anytime and switch with a tap.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Letters, numbers, and underscores only.</p>
            {usernameStatus.checking && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <Loader2 size={12} className="animate-spin mr-1" /> Checking availability...
              </div>
            )}
            {!usernameStatus.checking && usernameStatus.available === false && (
              <div className="mt-1 text-sm text-red-600 flex items-center">
                <X size={12} className="mr-1" /> Username is already taken
              </div>
            )}
            {!usernameStatus.checking && usernameStatus.available === true && (
              <div className="mt-1 text-sm text-green-600 flex items-center">
                <Check size={12} className="mr-1" /> Username is available
              </div>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email address"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              placeholder="+1234567890"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              pattern={PASSWORD_PATTERN.source}
              placeholder="Create a strong password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Must contain at least 8 characters with uppercase, lowercase, and numbers</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              id="account_type"
              name="account_type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'buyer' | 'seller')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className="rounded-md bg-light/40 border border-border/60 p-3 text-sm text-dark">
            After sign up, you&apos;ll complete your shop or shipping details during onboarding.
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/legal/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          {state.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{state.error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={pending || usernameStatus.available === false}
            className="w-full flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
