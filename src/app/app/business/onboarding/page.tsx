import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { BusinessProfileForm } from '../profile-form';
import styles from '../business.module.css';

export default async function BusinessOnboardingPage() {
  const user = await requireSession('/app/business/onboarding');
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);

  if (!config.features.registration_enabled) {
    return (
      <div className={`${styles.page} ${styles.narrow}`}>
        <h1 className={styles.title}>Markt Business</h1>
        <div className={`${styles.notice} ${styles.noticeInfo}`} style={{ marginTop: '1rem' }}>
          <p>New business sign-ups are paused at the moment. Please check back soon.</p>
        </div>
      </div>
    );
  }

  // Someone who turned business mode off keeps their profile; coming back
  // through onboarding just turns the tag on again with it pre-filled.
  const returning = !!mine?.profile;

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <Building2 size={14} /> Markt Business
          </p>
          <h1 className={styles.title}>{returning ? 'Welcome back' : 'Set up your business'}</h1>
          <p className={styles.sub}>
            Use the account you already have. Your everyday Markt shopping stays exactly as it is, and you can switch
            between Markt and Markt Business at any time.
          </p>
        </div>
      </header>

      <BusinessProfileForm config={config} profile={mine?.profile ?? null} isBuyer={user.is_buyer} isSeller={user.is_seller} onboarding />

      <p className={styles.hint} style={{ marginTop: '1.25rem' }}>
        Registering doesn&apos;t make your business verified — that&apos;s a separate review by the Markt team.{' '}
        <Link href="/app/dashboard" className={styles.link}>
          Not now
        </Link>
      </p>
    </div>
  );
}
