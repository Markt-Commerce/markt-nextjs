import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/session';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; expired?: string }>;
}) {
  const user = await getSession();
  if (user) redirect('/app/dashboard');

  const { returnUrl, expired } = await searchParams;
  return <LoginForm returnUrl={returnUrl} expired={expired === '1'} />;
}
