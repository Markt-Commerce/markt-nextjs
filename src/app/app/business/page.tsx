import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Building2,
  ClipboardList,
  MessageCircle,
  PackagePlus,
  Receipt,
  Search,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness, searchListings } from '@/lib/api/business';
import { listMyRequests, listRequests } from '@/lib/api/requests';
import { listOrders } from '@/lib/api/orders';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity, type BusinessProfile } from '@/lib/types/business';
import { VerificationBadge } from './verification-badge';
import styles from './business.module.css';

const ACTIVE_ORDER_STATUSES = new Set(['pending_payment', 'ready_for_delivery', 'pending', 'processing', 'shipped']);

/** The optional details that make a profile worth contacting. */
function profileCompletion(p: BusinessProfile): { percent: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ['a description', !!p.description],
    ['your industry', !!p.industry],
    ['your city and state', !!(p.city && p.state)],
    ['a contact email or phone', !!(p.contact_email || p.contact_phone)],
    ['your address', !!p.address],
  ];
  const done = checks.filter(([, ok]) => ok).length + 1; // name + types are required, count once
  return {
    percent: Math.round((done / (checks.length + 1)) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

interface QuickAction {
  href: string;
  icon: LucideIcon;
  label: string;
}

export default async function BusinessDashboardPage() {
  const user = await requireSession('/app/business');
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  const profile = mine.profile;
  const sells = user.is_seller;
  const buys = user.is_buyer;
  const units = config.units;

  const [myListings, myRequests, openRequests, orders] = await Promise.all([
    sells ? safeFetch(() => searchListings({ sellerUserId: user.id, perPage: 5 }, cookie), null) : null,
    buys ? safeFetch(() => listMyRequests(cookie), null) : null,
    sells && config.features.procurement_enabled
      ? safeFetch(() => listRequests({ isBusiness: true, status: 'OPEN', perPage: 6 }, cookie), null)
      : null,
    // Business orders only: everyday shopping stays on the consumer dashboard.
    safeFetch(() => listOrders(cookie, { isBusiness: true }), []),
  ]);

  const myProcurement = (myRequests?.items ?? []).filter((r) => r.is_business);
  const myOpenProcurement = myProcurement.filter((r) => r.status === 'OPEN');
  const offersWaiting = myOpenProcurement.reduce((n, r) => n + r.offers.filter((o) => o.status === 'PENDING').length, 0);
  const incoming = (openRequests?.items ?? []).filter((r) => r.user_id !== user.id);
  const activeOrders = orders.filter((o) => ACTIVE_ORDER_STATUSES.has(o.status));
  const completion = profileCompletion(profile);

  // Producers see supply first, manufacturers see sourcing first.
  const sellActions: QuickAction[] = [
    { href: '/app/business/products/new', icon: PackagePlus, label: 'Add a product' },
    { href: '/app/business/procurement?tab=open', icon: ClipboardList, label: 'Answer procurement requests' },
  ];
  const buyActions: QuickAction[] = [
    { href: '/app/business/discover', icon: Search, label: 'Find suppliers' },
    { href: '/app/business/procurement/new', icon: ClipboardList, label: 'Create a procurement request' },
  ];
  const quickActions: QuickAction[] = [
    ...(sells && !buys ? sellActions : []),
    ...(buys ? buyActions : []),
    ...(sells && buys ? sellActions : []),
    { href: '/app/orders', icon: Receipt, label: 'View orders' },
    { href: '/app/chat', icon: MessageCircle, label: 'Messages' },
    { href: '/app/business/profile', icon: UserCog, label: 'Edit business profile' },
  ].filter((a) => config.features.procurement_enabled || !a.href.includes('/procurement'));

  return (
    <div className={styles.page}>
      {mine.requires_subscription && (
        <div className={`${styles.notice} ${styles.noticeWarning}`}>
          <p>
            Your business profile is saved, but it isn&apos;t visible to other businesses until you choose a plan.{' '}
            <Link href="/app/business/subscription" className={styles.link}>
              See plans
            </Link>
          </p>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.profileHead}>
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo_url} alt="" className={styles.logo} />
          ) : (
            <span className={styles.logo} aria-hidden>
              <Building2 size={26} />
            </span>
          )}
          <div>
            <p className={styles.eyebrow}>Business dashboard</p>
            <h1 className={styles.title}>{profile.name}</h1>
            <div className={styles.facts} style={{ paddingTop: '0.45rem' }}>
              <VerificationBadge status={profile.verification_status} />
              {buys && <span className={styles.chip}>Buys</span>}
              {sells && <span className={styles.chip}>Sells</span>}
              {profile.city && <span className={styles.chip}>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
        </div>
      </header>

      <section className={styles.stats} aria-label="Overview">
        <Link href="/app/business/profile" className={styles.stat}>
          <p className={styles.statLabel}>Profile completion</p>
          <p className={styles.statValue}>{completion.percent}%</p>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${completion.percent}%` }} />
          </div>
          {completion.missing.length > 0 && <p className={styles.statHint}>Add {completion.missing[0]}</p>}
        </Link>
        {sells && (
          <Link href="/app/business/products" className={styles.stat}>
            <p className={styles.statLabel}>Active business listings</p>
            <p className={styles.statValue}>{myListings?.pagination.total_items ?? '—'}</p>
          </Link>
        )}
        {buys && config.features.procurement_enabled && (
          <Link href="/app/business/procurement" className={styles.stat}>
            <p className={styles.statLabel}>Open procurement requests</p>
            <p className={styles.statValue}>{myRequests ? myOpenProcurement.length : '—'}</p>
            {offersWaiting > 0 && <p className={styles.statHint}>{offersWaiting} offer{offersWaiting === 1 ? '' : 's'} to review</p>}
          </Link>
        )}
        {sells && config.features.procurement_enabled && (
          <Link href="/app/business/procurement?tab=open" className={styles.stat}>
            <p className={styles.statLabel}>Incoming requests</p>
            <p className={styles.statValue}>{openRequests ? incoming.length : '—'}</p>
            <p className={styles.statHint}>Open requests from businesses</p>
          </Link>
        )}
        <Link href="/app/orders" className={styles.stat}>
          <p className={styles.statLabel}>Active business orders</p>
          <p className={styles.statValue}>{activeOrders.length}</p>
        </Link>
      </section>

      <h2 className={styles.sectionTitle}>Quick actions</h2>
      <div className={styles.quick}>
        {quickActions.map((a) => (
          <Link key={a.href} href={a.href} className={styles.quickItem}>
            <span className={styles.quickIcon}>
              <a.icon size={17} />
            </span>
            {a.label}
          </Link>
        ))}
      </div>

      <div className={styles.grid2} style={{ marginTop: '0.5rem' }}>
        {sells && config.features.procurement_enabled && (
          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Requests you could supply</h2>
              <Link href="/app/business/procurement?tab=open" className={styles.link}>
                See all
              </Link>
            </div>
            {incoming.length === 0 ? (
              <div className={styles.empty}>
                <p>No open procurement requests right now.</p>
              </div>
            ) : (
              <div className={styles.list}>
                {incoming.slice(0, 5).map((r) => (
                  <Link key={r.id} href={`/app/requests/${r.id}`} className={styles.listItem}>
                    <div className={styles.listMain}>
                      <p className={styles.listTitle}>{r.title}</p>
                      <p className={styles.listMeta}>
                        {[formatQuantity(r.quantity, r.unit, units), r.delivery_location].filter(Boolean).join(' · ') || 'Details in request'}
                      </p>
                    </div>
                    <span className={styles.listAside}>
                      {r.offers.length} offer{r.offers.length === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {buys && config.features.procurement_enabled && (
          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Your procurement requests</h2>
              <Link href="/app/business/procurement" className={styles.link}>
                See all
              </Link>
            </div>
            {myProcurement.length === 0 ? (
              <div className={styles.empty}>
                <p>Tell suppliers what you need and let them come to you.</p>
                <Link href="/app/business/procurement/new" className={styles.btnPrimary}>
                  Create a request
                </Link>
              </div>
            ) : (
              <div className={styles.list}>
                {myProcurement.slice(0, 5).map((r) => (
                  <Link key={r.id} href={`/app/requests/${r.id}`} className={styles.listItem}>
                    <div className={styles.listMain}>
                      <p className={styles.listTitle}>{r.title}</p>
                      <p className={styles.listMeta}>
                        {r.status.toLowerCase()}
                        {r.quantity ? ` · ${formatQuantity(r.quantity, r.unit, units)}` : ''}
                      </p>
                    </div>
                    <span className={styles.listAside}>
                      {r.offers.length} offer{r.offers.length === 1 ? '' : 's'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {sells && (
          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Your business listings</h2>
              <Link href="/app/business/products" className={styles.link}>
                Manage
              </Link>
            </div>
            {!myListings || myListings.items.length === 0 ? (
              <div className={styles.empty}>
                <p>Add units, minimum orders and specifications so businesses can find your products.</p>
                <Link href="/app/business/products" className={styles.btnPrimary}>
                  Set up listings
                </Link>
              </div>
            ) : (
              <div className={styles.list}>
                {myListings.items.map((l) => (
                  <Link key={l.id} href={`/app/business/products/${l.id}`} className={styles.listItem}>
                    <div className={styles.listMain}>
                      <p className={styles.listTitle}>{l.name}</p>
                      <p className={styles.listMeta}>
                        {formatQuantity(l.business_listing.available_quantity, l.business_listing.unit, units) || 'Quantity not set'}{' '}
                        available
                      </p>
                    </div>
                    <span className={styles.listAside}>{formatNaira(l.price)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Recent business orders</h2>
            <Link href="/app/orders" className={styles.link}>
              All orders
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className={styles.empty}>
              <p>Orders you place as a business appear here.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {orders.slice(0, 5).map((o) => (
                <Link key={o.id} href={`/app/orders/${o.id}`} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>Order {o.order_number}</p>
                    <p className={styles.listMeta}>
                      {o.status.replace(/_/g, ' ')} · {new Date(o.created_at).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                  <span className={styles.listAside}>{formatNaira(o.subtotal)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
