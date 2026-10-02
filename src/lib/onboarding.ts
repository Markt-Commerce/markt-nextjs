import type { OnboardingStep, UserProfile } from './types/user';

/** The raw server-declared step (or null if onboarding is complete/absent). */
export function onboardingStep(user: UserProfile): OnboardingStep {
  return user.onboarding?.next_step ?? null;
}

/**
 * The step that should route a signed-in user INTO the web onboarding flow, or
 * null if they belong in the app. Cross-checks against the real role flags so a
 * stale `choose_role` can never trap someone who already has a role (avoids an
 * app ⇄ onboarding redirect loop). `verify_email` is handled by the auth verify
 * screen, and unknown/absent steps are treated as "done" — we never trap a user
 * on a value we don't recognise.
 */
export function pendingOnboardingStep(user: UserProfile): Exclude<OnboardingStep, null> | null {
  const step = onboardingStep(user);
  if (step === 'choose_role') {
    return !user.is_buyer && !user.is_seller ? 'choose_role' : null;
  }
  if (step === 'buyer_profile' || step === 'seller_profile') return step;
  return null;
}

/** Whether the account still needs to verify its email. */
export function needsEmailVerification(user: UserProfile): boolean {
  return user.onboarding?.email_verified === false || user.email_verified === false;
}
