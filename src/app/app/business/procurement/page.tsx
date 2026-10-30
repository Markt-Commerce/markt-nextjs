import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness } from '@/lib/api/business';
import { listMyRequests, listRequests } from '@/lib/api/requests';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity } from '@/lib/types/business';
import type { BuyerRequest } from '@/lib/types/request';
import styles from '../business.module.css';

const STATUS_TONE: Record<string, string> = {
  OPEN: 'badgeSuccess',
  FULFILLED: 'badgeBrand',
  CLOSED: 'badgeMuted',
  EXPIRED: 'badgeMuted',
};

function RequestRow({ request, units, showOffers }: { request: BuyerRequest; units: { key: string; label: string }[]; showOffers: boolean }) {
  const pending = request.offers.filter((o) => o.status === 'PENDING').length;
  const details = [
    formatQuantity(request.quantity, request.unit, units),
    request.delivery_location && `to ${request.delivery_location}`,
    request.required_delivery_date && `by ${new Date(request.required_delivery_date).toLocaleDateString('en-NG')}`,
    request.budget && `budget ${formatNaira(request.budget)}`,
  ].filter(Boolean);

  return (
    <Link href={`/app/requests/${request.id}`} className={styles.listItem}>
      <div className={styles.listMain}>
        <p className={styles.listTitle}>{request.title}</p>
        <p className={styles.listMeta}>{details.join(' · ') || request.description.slice(0, 90)}</p>
      </div>
      <span className={styles.listAside}>
        <span className={`${styles.badge} ${styles[STATUS_TONE[request.status] ?? 'badgeMuted']}`}>{request.status.toLowerCase()}</span>
        <br />
        <span className={styles.listMeta}>
          {showOffers && pending > 0 ? `${pending} to review` : `${request.offers.length} offer${request.offers.length === 1 ? '' : 's'}`}
        </span>
      </span>
    </Link>
  );
}

export default async function ProcurementPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const user = await requireSession('/app/business/procurement');
  const { tab: tabParam, q } = await searchParams;
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  if (!config.features.procurement_enabled) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Procurement</h1>
        <div className={`${styles.notice} ${styles.noticeInfo}`} style={{ marginTop: '1rem' }}>
          <p>Procurement requests aren&apos;t available right now.</p>
        </div>
      </div>
    );
  }

  // Buyers land on their own requests; seller-only businesses on open ones.
  const tab = tabParam === 'open' || (!user.is_buyer && tabParam !== 'mine') ? 'open' : 'mine';

  const [myRequests, openRequests] = await Promise.all([
    tab === 'mine' && user.is_buyer ? safeFetch(() => listMyRequests(cookie), null) : null,
    tab === 'open' ? safeFetch(() => listRequests({ isBusiness: true, status: 'OPEN', search: q, perPage: 50 }, cookie), null) : null,
  ]);

  const mineItems = (myRequests?.items ?? []).filter((r) => r.is_business);
  const openItems = (openRequests?.items ?? []).filter((r) => r.user_id !== user.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Procurement</p>
          <h1 className={styles.title}>Procurement requests</h1>
          <p className={styles.sub}>
            A request isn&apos;t an order. Review offers, agree the details in chat, then order through Markt.
          </p>
        </div>
        {user.is_buyer && (
          <Link href="/app/business/procurement/new" className={styles.btnPrimary}>
            <ClipboardList size={15} /> New request
          </Link>
        )}
      </header>

      <nav className={styles.tabs}>
        {user.is_buyer && (
          <Link href="/app/business/procurement?tab=mine" className={cn(styles.tab, tab === 'mine' && styles.tabActive)}>
            My requests
          </Link>
        )}
        <Link href="/app/business/procurement?tab=open" className={cn(styles.tab, tab === 'open' && styles.tabActive)}>
          Open requests from businesses
        </Link>
      </nav>

      {tab === 'mine' &&
        (!myRequests ? (
          <div className={styles.empty}>
            <p>Your requests couldn&apos;t be loaded right now.</p>
          </div>
        ) : mineItems.length === 0 ? (
          <div className={styles.empty}>
            <p>Describe what you need — product, quantity, specifications, delivery — and suppliers will send offers.</p>
            <Link href="/app/business/procurement/new" className={styles.btnPrimary}>
              Create your first request
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {mineItems.map((r) => (
              <RequestRow key={r.id} request={r} units={config.units} showOffers />
            ))}
          </div>
        ))}

      {tab === 'open' && (
        <>
          <form method="get" className={styles.filters} style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
            <input type="hidden" name="tab" value="open" />
            <input name="q" className={styles.input} defaultValue={q ?? ''} placeholder="Search requests" aria-label="Search requests" />
            <button type="submit" className={styles.btnPrimary}>
              Search
            </button>
          </form>
          {!openRequests ? (
            <div className={styles.empty}>
              <p>Requests couldn&apos;t be loaded right now.</p>
            </div>
          ) : openItems.length === 0 ? (
            <div className={styles.empty}>
              <p>No open procurement requests{q ? ' match that search' : ' right now'}.</p>
            </div>
          ) : (
            <>
              {!user.is_seller && (
                <div className={`${styles.notice} ${styles.noticeInfo}`}>
                  <p>
                    To send offers you need a seller account.{' '}
                    <Link href="/app/settings" className={styles.link}>
                      Add one in Settings
                    </Link>
                  </p>
                </div>
              )}
              <div className={styles.list}>
                {openItems.map((r) => (
                  <RequestRow key={r.id} request={r} units={config.units} showOffers={false} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
