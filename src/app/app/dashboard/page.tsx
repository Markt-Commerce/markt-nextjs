import Link from 'next/link';
import { Store, ImagePlus, MessageCircle, Receipt, ShoppingCart, CheckCircle2, ChevronRight } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getAnalyticsOverview, getStartCards } from '@/lib/api/seller';
import { safeFetch } from '@/lib/api/safe';
import styles from './page.module.css';

export default async function DashboardPage() {
  const user = await requireSession();
  const isSeller = user.current_role === 'seller';
  const cookie = await getForwardedCookie();

  const [startCards, analytics] = isSeller
    ? await Promise.all([
        safeFetch(() => getStartCards(cookie), { items: [] }),
        safeFetch(() => getAnalyticsOverview(cookie), null),
      ])
    : [{ items: [] }, null];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Welcome back</p>
        <h1 className={styles.heroTitle}>{user.username}</h1>
        <p className={styles.heroSub}>
          You&apos;re signed in as a <strong>{user.current_role}</strong>.{' '}
          {user.email_verified ? 'Your email is verified.' : 'Consider verifying your email.'}
        </p>
      </section>

      <div className={styles.grid}>
        <Link href="/app/marketplace" className={styles.card}>
          <Store size={22} className={styles.cardIcon} />
          <p className={styles.cardTitle}>Browse Marketplace</p>
          <p className={styles.cardDesc}>Discover products by category from sellers near you.</p>
        </Link>
        <Link href="/app/cart" className={styles.card}>
          <ShoppingCart size={22} className={styles.cardIcon} />
          <p className={styles.cardTitle}>Your Cart</p>
          <p className={styles.cardDesc}>Review items you&apos;ve saved for checkout.</p>
        </Link>
        <Link href="/app/chat" className={styles.card}>
          <MessageCircle size={22} className={styles.cardIcon} />
          <p className={styles.cardTitle}>Messages</p>
          <p className={styles.cardDesc}>Chat with buyers and sellers.</p>
        </Link>
        <Link href="/app/orders" className={styles.card}>
          <Receipt size={22} className={styles.cardIcon} />
          <p className={styles.cardTitle}>Orders</p>
          <p className={styles.cardDesc}>Track your buying and selling activity.</p>
        </Link>
        <Link href="/app/media" className={styles.card}>
          <ImagePlus size={22} className={styles.cardIcon} />
          <p className={styles.cardTitle}>Media Library</p>
          <p className={styles.cardDesc}>Upload and manage photos and videos.</p>
        </Link>
      </div>

      {isSeller && (
        <>
          <h2 className={styles.sectionTitle}>Get your shop ready</h2>
          <div className={styles.startCards}>
            {startCards.items.map((card) => (
              <div key={card.key} className={styles.startCard}>
                <div className={styles.startCardHead}>
                  <p className={styles.startCardTitle}>{card.title}</p>
                  {card.completed && (
                    <span className={styles.completedTag}>
                      <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} /> Done
                    </span>
                  )}
                </div>
                <p className={styles.startCardDesc}>{card.description}</p>
                {!card.completed && (
                  <Link href={card.cta.href} className={styles.startCardCta}>
                    {card.cta.label} <ChevronRight size={13} style={{ display: 'inline', verticalAlign: -2 }} />
                  </Link>
                )}
              </div>
            ))}
          </div>

          <h2 className={styles.sectionTitle}>Last 30 days</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Revenue</p>
              <p className={styles.statValue}>${analytics?.revenue_30d.toFixed(2) ?? '—'}</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Orders</p>
              <p className={styles.statValue}>{analytics?.orders_30d ?? '—'}</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Views</p>
              <p className={styles.statValue}>{analytics?.views_30d ?? '—'}</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Conversion</p>
              <p className={styles.statValue}>{analytics?.conversion_30d ?? '—'}%</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
