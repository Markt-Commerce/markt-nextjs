import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/session';
import { safeReturnUrl } from '@/lib/return-url';
import { RegisterForm } from './register-form';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  // e.g. the public site's "Get started" sends returnUrl=/app/business/onboarding.
  const returnUrl = safeReturnUrl((await searchParams).returnUrl);
  const user = await getSession();
  if (user) redirect(returnUrl);

  return <RegisterForm returnUrl={returnUrl} />;
}
