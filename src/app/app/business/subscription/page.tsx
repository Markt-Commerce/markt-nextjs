import { notFound, redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness, getMySubscription, listSubscriptionPlans } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira } from '@/lib/types/business';
import styles from '../business.module.css';

/**
 * Exists only while the backend has subscriptions switched on. With them off
 * the route 404s and nothing links here, so there's no dead page or empty
 * slot to stumble on.
 */
export default async function BusinessSubscriptionPage() {
  await requireSession('/app/business/subscription');
  const config = await getBusinessConfig();
  if (!config.features.subscriptions_enabled) notFound();

  const cookie = await getForwardedCookie();
  const mine = await safeFetch(() => getMyBusiness(cookie), null);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  const [plans, current] = await Promise.all([
    safeFetch(() => listSubscriptionPlans(cookie), []),
    safeFetch(() => getMySubscription(cookie), null),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Subscription</p>
          <h1 className={styles.title}>Markt Business plans</h1>
          {current && (
            <p className={styles.sub}>
              You&apos;re on <strong>{current.plan.name}</strong>
              {current.end_date ? ` until ${new Date(current.end_date).toLocaleDateString('en-NG')}` : ''}.
            </p>
          )}
        </div>
      </header>

      {plans.length === 0 ? (
        <div className={styles.empty}>
          <p>Plans aren&apos;t available yet. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid3}>
          {plans.map((plan) => {
            const isCurrent = current?.plan.id === plan.id;
            return (
              <div key={plan.id} className={styles.card} style={isCurrent ? { borderColor: 'var(--brand)' } : undefined}>
                <div className={styles.sectionHead} style={{ margin: 0 }}>
                  <p className={styles.cardTitle}>{plan.name}</p>
                  {isCurrent && <span className={`${styles.badge} ${styles.badgeBrand}`}>Current</span>}
                </div>
                <p className={styles.statValue} style={{ margin: '0.5rem 0 0.25rem' }}>
                  {plan.price > 0 ? formatNaira(plan.price) : 'Free'}
                </p>
                {plan.price > 0 && <p className={styles.listMeta}>per {plan.billing_interval.replace(/ly$/, '')}</p>}
                {plan.description && (
                  <p className={styles.cardText} style={{ margin: '0.75rem 0' }}>
                    {plan.description}
                  </p>
                )}
                {plan.features.length > 0 && (
                  <ul className={styles.cardText} style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.35rem' }}>
                    {plan.features.map((f) => (
                      <li key={f.feature_key} className={styles.iconLine}>
                        <Check size={13} style={{ color: 'var(--success)' }} />
                        {f.feature_key.replace(/_/g, ' ')}
                        {f.limit_value != null ? ` (up to ${f.limit_value})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {!isCurrent && (
                  // Online checkout for plans isn't built yet (the backend
                  // records subscriptions from a confirmed payment only), so
                  // this hands off to the team rather than faking a purchase.
                  <a
                    href={`mailto:support@marktcommerce.com?subject=${encodeURIComponent(`Markt Business plan: ${plan.name}`)}`}
                    className={styles.btnPrimary}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    Choose {plan.name}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
