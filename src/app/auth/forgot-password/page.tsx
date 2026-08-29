'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { forgotPasswordAction, type FormState } from '../actions';

const initialState: FormState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  useEffect(() => {
    if (state.error) console.error('[forgot-password]', state.error);
  }, [state.error]);

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f4f1f0] px-10">
          <div className="flex items-center gap-6 text-[#181211]">
            <div className="h-12 lg:h-16 xl:h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/markt-text-logo.png" alt="Markt" className="h-full w-auto object-contain drop-shadow-lg" />
            </div>
          </div>
          <Link
            href="/auth/login"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e85530] text-white text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Back to sign in</span>
          </Link>
        </header>

        <div className="px-4 lg:px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-full max-w-[512px] py-5 flex-1">
            {!state.success && (
              <>
                <h2 className="text-[#181211] tracking-tight text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                  Reset your password
                </h2>
                <p className="text-[#181211] text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">
                  Enter the email address associated with your account and we&apos;ll send you a code to reset your password.
                </p>

                <form action={formAction}>
                  <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                      <p className="text-[#181211] text-base font-medium leading-normal pb-2">Email</p>
                      <input
                        name="email"
                        placeholder="your.email@example.com"
                        type="email"
                        required
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#181211] focus:outline-0 focus:ring-0 border border-[#e5dddc] bg-white h-14 placeholder:text-[#886a63] p-[15px] text-base font-normal leading-normal"
                      />
                    </label>
                  </div>

                  {state.error && (
                    <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{state.error}</div>
                  )}

                  <div className="flex px-4 py-3">
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-[#e85530] text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">{pending ? 'Sending...' : 'Send reset code'}</span>
                    </button>
                  </div>
                </form>

                <p className="text-[#886a63] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
                  <Link href="/auth/login" className="underline hover:no-underline">
                    Remember your password? Sign in
                  </Link>
                </p>
              </>
            )}

            {state.success && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">✓</div>
                <h2 className="text-[#181211] text-[28px] font-bold leading-tight mb-4">Check Your Email</h2>
                <p className="text-[#181211] text-base font-normal leading-normal mb-4">We&apos;ve sent a password reset code to your email.</p>
                <p className="text-[#886a63] text-sm font-normal leading-normal mb-6">Follow the instructions in the email to reset your password.</p>
                <Link
                  href="/auth/login"
                  className="inline-flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e85530] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                >
                  <span className="truncate">Back to Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
