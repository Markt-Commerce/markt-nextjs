import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/session';
import { ResetForm } from './reset-form';

export default async function ForgotPasswordPage() {
  const user = await getSession();
  if (user) redirect('/app/dashboard');

  return <ResetForm />;
}
