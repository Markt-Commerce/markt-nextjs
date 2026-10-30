import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness, getMySubscription } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { disableBusinessAction } from '../actions';
import { BusinessProfileForm } from '../profile-form';
import { VerificationBadge } from '../verification-badge';
import { BusinessImagesCard } from './images-card';
import { VerificationRequestButton } from './verification-request';
import styles from '../business.module.css';

export default async function BusinessProfilePage() {
  const user = await requireSession('/app/business/profile');
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  const subscriptionsOn = config.features.subscriptions_enabled;
  const canRequestVerification =
    config.features.verification_enabled &&
    (mine.profile.verification_status === 'UNVERIFIED' || mine.profile.verification_status === 'REJECTED');
  const subscription = subscriptionsOn ? await safeFetch(() => getMySubscription(cookie), null) : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Business profile</p>
          <h1 className={styles.title}>{mine.profile.name}</h1>
        </div>
        <Link href={`/app/business/businesses/${user.id}`} className={styles.btnOutline}>
          <ExternalLink size={14} /> View public profile
        </Link>
      </header>

      <div className={styles.split}>
        <BusinessProfileForm config={config} profile={mine.profile} isBuyer={user.is_buyer} isSeller={user.is_seller} />

        <aside className={styles.form}>
          <BusinessImagesCard logoUrl={mine.profile.logo_url} coverUrl={mine.profile.cover_image_url} />

          <div className={styles.card}>
            <p className={styles.cardTitle}>Verification</p>
            <div style={{ margin: '0.4rem 0 0.6rem' }}>
              <VerificationBadge status={mine.profile.verification_status} />
            </div>
            <p className={styles.cardText} style={{ marginBottom: canRequestVerification ? '0.75rem' : 0 }}>
              Verification is a review by the Markt team and is separate from registration.
              {mine.profile.verification_status === 'PENDING' && ' Your request is with the team.'}
              {mine.profile.verification_status === 'REJECTED' && ' Your last request wasn’t approved — update your details and ask again.'}
            </p>
            {/* Only while the backend has the review queue open. */}
            {canRequestVerification && <VerificationRequestButton />}
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>How your business trades</p>
            <ul className={styles.cardText} style={{ paddingLeft: '1.1rem', margin: '0.4rem 0 0.75rem' }}>
              <li>{user.is_buyer ? 'Buying: set up — you can post procurement requests.' : 'Buying: not set up.'}</li>
              <li>{user.is_seller ? 'Selling: set up — you can list products.' : 'Selling: not set up.'}</li>
            </ul>
            {(!user.is_buyer || !user.is_seller) && (
              <Link href="/app/settings" className={styles.link}>
                Add {user.is_buyer ? 'selling' : 'buying'} in Settings
              </Link>
            )}
          </div>

          {/* Only exists while subscriptions are on — no empty slot otherwise. */}
          {subscriptionsOn && (
            <div className={styles.card}>
              <p className={styles.cardTitle}>Subscription</p>
              <p className={styles.cardText} style={{ margin: '0.4rem 0 0.75rem' }}>
                {subscription ? (
                  <>
                    <span className={`${styles.badge} ${styles.badgeBrand}`}>{subscription.plan.name}</span>{' '}
                    {subscription.end_date && `until ${new Date(subscription.end_date).toLocaleDateString('en-NG')}`}
                  </>
                ) : (
                  'No active plan.'
                )}
              </p>
              <Link href="/app/business/subscription" className={styles.link}>
                {subscription ? 'Manage subscription' : 'See plans'}
              </Link>
            </div>
          )}

          <div className={styles.card}>
            <p className={styles.cardTitle}>Turn off Markt Business</p>
            <p className={styles.cardText} style={{ margin: '0.4rem 0 0.75rem' }}>
              Your business stops appearing in discovery. Your profile is kept, so you can turn it back on later.
              Products, requests and orders are not deleted.
            </p>
            <form action={disableBusinessAction}>
              <button type="submit" className={styles.btnDanger}>
                Turn off
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
