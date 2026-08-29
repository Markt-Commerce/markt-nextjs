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
import styles from './page.module.css';

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

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Welcome back</p>
        <h1 className={styles.heroTitle}>{user.username}</h1>
        <p className={styles.heroSub}>
          You&apos;re browsing as a <strong>{user.current_role}</strong>.{' '}
          {user.email_verified ? null : (
            <Link href="/auth/verify-email" className={styles.verifyLink}>
              Verify your email
            </Link>
          )}
        </p>
      </section>

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

      {isSeller && startCards.items.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Get your shop ready</h2>
          <div className={styles.startCards}>
            {startCards.items.map((card) => (
              <div key={card.key} className={styles.startCard}>
                <div className={styles.startCardHead}>
                  <p className={styles.startCardTitle}>{card.title}</p>
                  {card.completed && (
                    <span className={styles.completedTag}>
                      <CheckCircle2 size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                      Done
                    </span>
                  )}
                </div>
                <p className={styles.startCardDesc}>{card.description}</p>
                {!card.completed && (
                  <Link href={card.cta.href} className={styles.startCardCta}>
                    {card.cta.label} <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isSeller && (
        <>
          <h2 className={styles.sectionTitle}>Last 30 days</h2>
          <div className={styles.analyticsGrid}>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Revenue</p>
              <p className={styles.statValue}>{analytics ? `$${analytics.revenue_30d.toFixed(2)}` : '—'}</p>
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
        </>
      )}
    </div>
  );
}
