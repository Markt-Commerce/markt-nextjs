import { notFound, redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness, getMySubscription, listSubscriptionPlans, verifySubscription } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira } from '@/lib/types/business';
import { startCheckoutAction } from '../actions';
import styles from '../business.module.css';

const RESULT_NOTICE: Record<string, { tone: string; text: string }> = {
  success: { tone: 'noticeSuccess', text: 'Payment confirmed — your plan is active.' },
  pending: {
    tone: 'noticeInfo',
    text: 'We’re still confirming your payment with Paystack. This usually takes a minute — refresh to check.',
  },
  failed: { tone: 'noticeWarning', text: 'That payment didn’t go through, so nothing was charged. You can try again.' },
  error: { tone: 'noticeWarning', text: 'We couldn’t start the payment. Please try again in a moment.' },
};

/**
 * Exists only while the backend has subscriptions switched on. With them off
 * the route 404s and nothing links here, so there's no dead page or empty
 * slot to stumble on.
 *
 * Paystack sends people back here (via the backend's callback) with
 * ?payment=…&subscription_id=…; the page re-confirms with the backend rather
 * than trusting the query string.
 */
export default async function BusinessSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; subscription_id?: string }>;
}) {
  await requireSession('/app/business/subscription');
  const config = await getBusinessConfig();
  if (!config.features.subscriptions_enabled) notFound();

  const cookie = await getForwardedCookie();
  const mine = await safeFetch(() => getMyBusiness(cookie), null);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  const { payment, subscription_id: subscriptionId } = await searchParams;
  let result = payment && RESULT_NOTICE[payment] ? payment : undefined;
  if (subscriptionId && Number(subscriptionId)) {
    const verified = await safeFetch(() => verifySubscription(Number(subscriptionId), cookie), null);
    if (verified) result = verified.verified ? 'success' : verified.status === 'EXPIRED' ? 'failed' : 'pending';
  }

  const [plans, current] = await Promise.all([
    safeFetch(() => listSubscriptionPlans(cookie), []),
    safeFetch(() => getMySubscription(cookie), null),
  ]);
  const notice = result ? RESULT_NOTICE[result] : null;

  return (
    <div className={styles.page}>
      {notice && (
        <div className={`${styles.notice} ${styles[notice.tone]}`}>
          <p>{notice.text}</p>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Subscription</p>
          <h1 className={styles.title}>Markt Business plans</h1>
          {current && (
            <p className={styles.sub}>
              You&apos;re on <strong>{current.plan.name}</strong>
              {current.end_date ? ` until ${new Date(current.end_date).toLocaleDateString('en-NG')}` : ''}. Plans run for one
              billing period and don&apos;t renew automatically.
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
                {/* Renewing is choosing the current plan again once it runs out. */}
                <form action={startCheckoutAction.bind(null, plan.id)} style={{ marginTop: '1rem' }}>
                  <button type="submit" className={isCurrent ? styles.btnOutline : styles.btnPrimary} style={{ width: '100%' }}>
                    {isCurrent ? 'Renew' : plan.price > 0 ? `Choose ${plan.name}` : `Switch to ${plan.name}`}
                  </button>
                </form>
                {plan.price > 0 && <p className={styles.hint} style={{ marginTop: '0.5rem', textAlign: 'center' }}>Paid securely with Paystack</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
