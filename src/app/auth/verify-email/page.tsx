'use client';

import { Suspense, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { verifyEmailAction, resendVerificationAction } from '../actions';

type Status = 'pending' | 'success' | 'error' | null;

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

  const code = searchParams.get('code');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<Status>(code && email ? null : 'pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, startVerifying] = useTransition();
  const [isResending, startResending] = useTransition();
  const cooldownRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const runVerify = (targetEmail: string, targetCode: string) => {
    startVerifying(async () => {
      const result = await verifyEmailAction(targetEmail, targetCode);
      if (result.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error ?? 'An error occurred during email verification. Please try again.');
        console.error('[verify-email]', result.error);
      }
    });
  };

  useEffect(() => {
    if (code && email) runVerify(email, code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const resend = () => {
    if (!email || isResending || resendCooldown > 0) return;
    startResending(async () => {
      const result = await resendVerificationAction(email);
      if (result.ok) {
        startCooldown();
        setStatus('pending');
        setErrorMessage('');
      } else {
        setErrorMessage(result.error ?? 'Could not resend verification email.');
        console.error('[verify-email:resend]', result.error);
      }
    });
  };

  const copy = {
    title:
      status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : status === 'pending' ? 'Verify Your Email' : 'Email Verification',
    main:
      status === 'success'
        ? 'Welcome to Markt! Your account is now active.'
        : status === 'error'
          ? "We couldn't verify your email address."
          : status === 'pending'
            ? "We've sent a verification code to your email address"
            : 'Verifying your email address...',
    secondary: status === 'pending' ? 'Please check your inbox and use the link or code to verify your account' : null,
  };

  const iconWrap =
    status === 'success' ? 'bg-success-soft' : status === 'error' ? 'bg-danger-soft' : status === 'pending' ? 'bg-surface-2' : 'bg-surface-2';
  const iconColor =
    status === 'success' ? 'text-success' : status === 'error' ? 'text-danger' : status === 'pending' ? 'text-primary' : 'text-muted';
  const HeaderIcon = status === 'success' ? CheckCircle2 : status === 'error' ? AlertTriangle : Mail;

  const primaryLabel =
    status === 'success'
      ? 'Continue to Login'
      : status === 'error'
        ? isResending
          ? 'Sending...'
          : 'Resend Verification Email'
        : status === 'pending'
          ? isResending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Verification Email'
          : 'Verifying...';

  const secondaryLabel = status === 'success' ? 'Go to Homepage' : status === 'error' ? 'Back to Registration' : 'Back to Login';

  const handlePrimary = () => {
    if (status === 'success') router.push('/auth/login');
    else if (status === 'error') {
      if (code && email) {
        setStatus(null);
        runVerify(email, code);
      } else {
        router.push('/auth/login');
      }
    } else {
      resend();
    }
  };

  const handleSecondary = () => {
    if (status === 'success') router.push('/');
    else if (status === 'error') router.push('/auth/register');
    else router.push('/auth/login');
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-surface overflow-x-hidden font-sans">
      <div className="flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-border px-10">
          <div className="flex items-center gap-6 text-dark">
            <div className="h-12 lg:h-16 xl:h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/markt-text-logo.png" alt="Markt" className="h-full w-auto object-contain drop-shadow-lg" />
            </div>
          </div>
          <Link
            href="/auth/login"
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-light text-dark text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">Back to Login</span>
          </Link>
        </header>

        <div className="px-4 lg:px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-full max-w-[512px] py-5 flex-1">
            <div className="w-full" style={{ height: 80 }} />

            <div className="flex w-full grow bg-surface p-4">
              <div className={`w-full gap-1 overflow-hidden bg-surface aspect-[3/2] rounded-lg flex flex-1 items-center justify-center ${iconWrap}`}>
                <HeaderIcon size={64} className={iconColor} />
              </div>
            </div>

            <h2 className="text-dark tracking-tight text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">{copy.title}</h2>
            <p className="text-dark text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">{copy.main}</p>
            {copy.secondary && (
              <p className="text-dark text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">{copy.secondary}</p>
            )}

            {status === 'error' && errorMessage && (
              <div className="mx-4 my-3 p-3 bg-danger-soft border border-danger-border text-danger rounded-lg text-sm text-center">{errorMessage}</div>
            )}

            {status === 'success' && (
              <div className="mx-4 my-3 p-3 bg-success-soft border border-success-border text-success rounded-lg text-sm text-center">
                Your email has been verified successfully! You can now access all features of your Markt account.
              </div>
            )}

            {isVerifying && (
              <div className="text-center py-4">
                <Loader2 size={24} className="text-primary animate-spin mb-2 mx-auto" />
                <p className="text-subtle text-sm">Verifying your email address...</p>
              </div>
            )}

            <div className="flex px-4 py-3">
              <button
                onClick={handlePrimary}
                disabled={isResending || (status === 'pending' && resendCooldown > 0)}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50"
              >
                {isResending && <Loader2 size={14} className="animate-spin mr-2" />}
                <span className="truncate">{primaryLabel}</span>
              </button>
            </div>

            <div className="flex px-4 py-3">
              <button
                onClick={handleSecondary}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-light text-dark text-sm font-bold leading-normal tracking-[0.015em]"
              >
                <span className="truncate">{secondaryLabel}</span>
              </button>
            </div>

            <p className="text-subtle text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
              <a href="mailto:support@marktcommerce.com" className="underline hover:text-primary">
                Need help? Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
