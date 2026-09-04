import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  Clipboard,
  Heart,
  ImagePlus,
  MessageCircle,
  Receipt,
  ShoppingCart,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getAnalyticsOverview, getStartCards } from '@/lib/api/seller';
import { safeFetch } from '@/lib/api/safe';
import type { StartCard } from '@/lib/types/seller';
import styles from './page.module.css';

// The API's start-card CTAs can point at routes this app doesn't have (the
// "add product" one 404s). Remap known steps to real destinations by keyword,
// falling back to whatever the API sent.
function resolveCtaHref(card: StartCard): string {
  const hint = `${card.key} ${card.cta.href}`.toLowerCase();
  if (hint.includes('product')) return '/app/media';
  if (hint.includes('profile')) return '/app/settings?tab=profile';
  if (hint.includes('verify') || hint.includes('email')) return '/auth/verify-email';
  if (hint.includes('post') || hint.includes('audience') || hint.includes('social')) return '/app/community/social-feed';
  if (hint.includes('order')) return '/app/orders';
  return card.cta.href;
}

interface Tile {
  href: string;
  icon: LucideIcon;
  title: string;
  copy: string;
  tone: string;
  wide?: boolean;
}

// Quick actions mirror the role-aware sidebar — a seller has no cart, a
// buyer has no media library, so neither is shown a dead end.
function tilesFor(isSeller: boolean, styleMap: Record<string, string>): Tile[] {
  const shared: Tile[] = [
    {
      href: '/app/marketplace',
      icon: Store,
      title: 'Explore the marketplace',
      copy: 'Discover what people near you are selling.',
      tone: styleMap.tileClay,
      wide: true,
    },
    {
      href: '/app/community/social-feed',
      icon: Users,
      title: 'Community',
      copy: 'See what people are finding.',
      tone: styleMap.tileMint,
    },
    {
      href: '/app/chat',
      icon: MessageCircle,
      title: 'Messages',
      copy: 'Talk to buyers and sellers.',
      tone: styleMap.tileSky,
    },
  ];

  const buyer: Tile[] = [
    {
      href: '/app/requests/create',
      icon: Clipboard,
      title: 'Ask sellers for it',
      copy: "Can't find something? Post a request and get offers.",
      tone: styleMap.tileButter,
      wide: true,
    },
    { href: '/app/cart', icon: ShoppingCart, title: 'Your cart', copy: 'Pick up where you left off.', tone: styleMap.tileLilac },
    { href: '/app/favorites', icon: Heart, title: 'Saved items', copy: 'Things you liked.', tone: styleMap.tileBlush },
  ];

  const seller: Tile[] = [
    {
      href: '/app/requests',
      icon: Clipboard,
      title: 'Buyers are asking',
      copy: 'Browse open requests and send an offer.',
      tone: styleMap.tileButter,
      wide: true,
    },
    { href: '/app/offers', icon: Tag, title: 'My offers', copy: 'Track what you’ve quoted.', tone: styleMap.tileLilac },
    { href: '/app/media', icon: ImagePlus, title: 'Media library', copy: 'Manage product photos.', tone: styleMap.tileBlush },
  ];

  return [...shared, ...(isSeller ? seller : buyer), { href: '/app/orders', icon: Receipt, title: 'Orders', copy: 'Track everything in motion.', tone: styleMap.tileSky }];
}

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

  const tiles = tilesFor(isSeller, styles);
  const cards = startCards.items;
  const pending = cards.filter((c) => !c.completed);
  const done = cards.filter((c) => c.completed);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Welcome back</p>
        <h1 className={styles.heroTitle}>{user.username}</h1>
        <p className={styles.heroSub}>
          You&apos;re browsing as a <strong>{user.current_role}</strong>.{' '}
          {isSeller && pending.length > 0 && (
            <>
              {pending.length} setup step{pending.length === 1 ? '' : 's'} left.{' '}
            </>
          )}
          {user.email_verified ? null : (
            <Link href="/auth/verify-email" className={styles.verifyLink}>
              Verify your email
            </Link>
          )}
        </p>
      </section>

      {/* A seller's dashboard leads with the seller's numbers. */}
      {isSeller && (
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Last 30 days</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Revenue</p>
              <p className={styles.statValue}>{analytics ? `₦${analytics.revenue_30d.toFixed(2)}` : '—'}</p>
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
              <p className={styles.statValue}>{analytics ? `${analytics.conversion_30d}%` : '—'}</p>
            </div>
          </div>
        </section>
      )}

      <div className={styles.bento}>
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={`${styles.tile} ${tile.tone} ${tile.wide ? styles.spanWide : ''}`}>
            <tile.icon size={20} />
            <div>
              <h2 className={styles.tileTitle}>{tile.title}</h2>
              <p className={styles.tileCopy}>{tile.copy}</p>
            </div>
            <ArrowUpRight size={18} className={styles.tileCorner} />
          </Link>
        ))}
      </div>

      {isSeller && cards.length > 0 && (
        <section>
          <div className={styles.readyHead}>
            <h2 className={styles.sectionTitle}>Get your shop ready</h2>
            <span className={styles.readyCount}>
              {done.length} of {cards.length} done
            </span>
          </div>

          {/* Things still to do lead; finished steps sit quietly alongside. */}
          <div className={styles.readyGrid}>
            <div className={styles.startCards}>
              {pending.length === 0 ? (
                <p className={styles.readyAllDone}>Everything&apos;s set up here. Nice work.</p>
              ) : (
                pending.map((card) => (
                  <div key={card.key} className={styles.startCard}>
                    <div className={styles.startCardHead}>
                      <p className={styles.startCardTitle}>{card.title}</p>
                    </div>
                    <p className={styles.startCardDesc}>{card.description}</p>
                    <Link href={resolveCtaHref(card)} className={styles.startCardCta}>
                      {card.cta.label} <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ))
              )}
            </div>

            {done.length > 0 && (
              <aside className={styles.readyDone}>
                <p className={styles.readyDoneTitle}>Already done</p>
                <ul className={styles.doneList}>
                  {done.map((card) => (
                    <li key={card.key} className={styles.doneItem}>
                      <CheckCircle2 size={14} className={styles.doneCheck} />
                      <span>{card.title}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
