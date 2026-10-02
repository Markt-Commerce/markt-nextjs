import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/api/session';
import { onboardingStep, pendingOnboardingStep } from '@/lib/onboarding';
import { listCategoryTree } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import { OnboardingFlow } from './onboarding-flow';

export const metadata = { title: 'Set up your account · Markt' };

export default async function OnboardingPage() {
  const user = await requireSession('/onboarding');

  // Server drives the route: verify first, then role/profile, else into the app.
  if (onboardingStep(user) === 'verify_email') redirect('/auth/verify-email');
  const step = pendingOnboardingStep(user);
  if (!step) redirect('/app/dashboard');

  // Categories are only needed where a seller shop can be created.
  const categories =
    step === 'seller_profile' || step === 'choose_role'
      ? (await safeFetch(() => listCategoryTree(), [])).map((c) => ({ id: c.id, name: c.name }))
      : [];

  return (
    <OnboardingFlow
      step={step}
      username={user.username}
      hasBuyer={user.is_buyer}
      hasSeller={user.is_seller}
      categories={categories}
    />
  );
}
