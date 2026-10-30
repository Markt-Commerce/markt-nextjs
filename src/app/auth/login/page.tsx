import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/session';
import { safeReturnUrl } from '@/lib/return-url';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { returnUrl } = await searchParams;
  // Already signed in (e.g. "Log in" on the public business site): go
  // straight where they were headed, not to the generic dashboard.
  const user = await getSession();
  if (user) redirect(safeReturnUrl(returnUrl));

  return <LoginForm returnUrl={returnUrl ? safeReturnUrl(returnUrl) : undefined} />;
}
