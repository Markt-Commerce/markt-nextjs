import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/session';
import { RegisterForm } from './register-form';

export default async function RegisterPage() {
  const user = await getSession();
  if (user) redirect('/app/dashboard');

  return <RegisterForm />;
}
