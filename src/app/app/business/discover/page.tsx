import Link from 'next/link';
import { Building2, Package } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { discoverBusinesses, getBusinessConfig, searchListings } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity, optionLabel, unitSingular } from '@/lib/types/business';
import { VerificationBadge } from '../verification-badge';
import styles from '../business.module.css';

type Tab = 'listings' | 'businesses';

interface SearchParams {
  tab?: string;
  q?: string;
  type?: string;
  industry?: string;
  state?: string;
  unit?: string;
  side?: string;
  page?: string;
}

function pageHref(params: SearchParams, page: number): string {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  qs.set('page', String(page));
  return `/app/business/discover?${qs.toString()}`;
}

export default async function BusinessDiscoverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireSession('/app/business/discover');
  const params = await searchParams;
  const tab: Tab = params.tab === 'businesses' ? 'businesses' : 'listings';
  const page = Math.max(1, Number(params.page) || 1);
  const cookie = await getForwardedCookie();
  const config = await getBusinessConfig();

  if (!config.features.discovery_enabled) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Discover</h1>
        <div className={`${styles.notice} ${styles.noticeInfo}`} style={{ marginTop: '1rem' }}>
          <p>Business discovery isn&apos;t available right now.</p>
        </div>
      </div>
    );
  }

  const side = params.side === 'buys' || params.side === 'sells' ? params.side : undefined;
  const [listings, businesses] = await Promise.all([
    tab === 'listings'
      ? safeFetch(() => searchListings({ search: params.q, unit: params.unit, state: params.state, page, perPage: 24 }, cookie), null)
      : null,
    tab === 'businesses'
      ? safeFetch(
          () =>
            discoverBusinesses(
              { search: params.q, businessType: params.type, industry: params.industry, state: params.state, side, page },
              cookie
            ),
          null
        )
      : null,
  ]);
  const pagination = (listings ?? businesses)?.pagination;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Discover</p>
          <h1 className={styles.title}>Find products and businesses</h1>
          <p className={styles.sub}>Search supply with business terms, or browse producers, manufacturers and suppliers.</p>
        </div>
      </header>

      <nav className={styles.tabs}>
        <Link href="/app/business/discover?tab=listings" className={cn(styles.tab, tab === 'listings' && styles.tabActive)}>
          Products
        </Link>
        <Link href="/app/business/discover?tab=businesses" className={cn(styles.tab, tab === 'businesses' && styles.tabActive)}>
          Businesses
        </Link>
      </nav>

      <form className={styles.filters} method="get">
        <input type="hidden" name="tab" value={tab} />
        <div className={styles.field}>
          <label htmlFor="q">Search</label>
          <input
            id="q"
            name="q"
            className={styles.input}
            defaultValue={params.q ?? ''}
            placeholder={tab === 'listings' ? 'Cassava, PET bottles, palm oil…' : 'Business name or description'}
          />
        </div>
        {tab === 'listings' ? (
          <div className={styles.field}>
            <label htmlFor="unit">Unit</label>
            <select id="unit" name="unit" className={styles.select} defaultValue={params.unit ?? ''}>
              <option value="">Any unit</option>
              {config.units.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.field}>
            <label htmlFor="type">Business type</label>
            <select id="type" name="type" className={styles.select} defaultValue={params.type ?? ''}>
              <option value="">Any type</option>
              {config.business_types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {tab === 'businesses' ? (
          <div className={styles.field}>
            <label htmlFor="industry">Industry</label>
            <select id="industry" name="industry" className={styles.select} defaultValue={params.industry ?? ''}>
              <option value="">Any industry</option>
              {config.industries.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span aria-hidden />
        )}
        <div className={styles.field}>
          <label htmlFor="state">State</label>
          <input id="state" name="state" className={styles.input} defaultValue={params.state ?? ''} placeholder="e.g. Oyo" />
        </div>
        <button type="submit" className={styles.btnPrimary}>
          Search
        </button>
        {tab === 'businesses' && (
          <div className={styles.facts} style={{ gridColumn: '1 / -1', paddingTop: 0 }}>
            {[
              ['', 'All businesses'],
              ['sells', 'Suppliers and producers'],
              ['buys', 'Buyers and manufacturers'],
            ].map(([value, label]) => (
              <label key={value} className={styles.check} style={{ padding: '0.35rem 0.7rem' }}>
                <input type="radio" name="side" value={value} defaultChecked={(side ?? '') === value} />
                {label}
              </label>
            ))}
          </div>
        )}
      </form>

      {tab === 'listings' &&
        (!listings ? (
          <div className={styles.empty}>
            <p>Listings couldn&apos;t be loaded right now.</p>
          </div>
        ) : listings.items.length === 0 ? (
          <div className={styles.empty}>
            <p>No business listings match. Try a broader search, or post a procurement request and let suppliers find you.</p>
            {config.features.procurement_enabled && (
              <Link href="/app/business/procurement/new" className={styles.btnPrimary}>
                Create a procurement request
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.grid3}>
            {listings.items.map((l) => {
              const t = l.business_listing;
              return (
                <Link key={l.id} href={`/app/business/listings/${l.id}`} className={styles.resultCard}>
                  {l.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image_url} alt="" className={styles.resultImage} />
                  ) : (
                    <div className={styles.resultImage} style={{ display: 'grid', placeItems: 'center', color: 'var(--text-subtle)' }}>
                      <Package size={28} />
                    </div>
                  )}
                  <div className={styles.resultBody}>
                    <p className={styles.resultTitle}>{l.name}</p>
                    <p className={styles.resultSeller}>
                      {l.business_name ?? 'Business'}
                      {t.state ? ` · ${[t.city, t.state].filter(Boolean).join(', ')}` : ''}
                    </p>
                    <p className={styles.resultPrice}>
                      {formatNaira(l.price)} <span className={styles.listMeta}>per {unitSingular(config.units, t.unit)}</span>
                    </p>
                    <div className={styles.facts}>
                      {t.price_negotiable && <span className={`${styles.badge} ${styles.badgeBrand}`}>Negotiable</span>}
                      {t.available_quantity != null && (
                        <span className={styles.chip}>{formatQuantity(t.available_quantity, t.unit, config.units)} available</span>
                      )}
                      {t.min_order_quantity != null && (
                        <span className={styles.chip}>Min. {formatQuantity(t.min_order_quantity, t.unit, config.units)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === 'businesses' &&
        (!businesses ? (
          <div className={styles.empty}>
            <p>Businesses couldn&apos;t be loaded right now.</p>
          </div>
        ) : businesses.items.length === 0 ? (
          <div className={styles.empty}>
            <p>No businesses match these filters yet.</p>
          </div>
        ) : (
          <div className={styles.grid3}>
            {businesses.items.map((b) => (
              <Link key={b.user_id} href={`/app/business/businesses/${b.user_id}`} className={`${styles.resultCard} ${styles.card}`}>
                <div className={styles.profileHead}>
                  {b.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo_url} alt="" className={styles.logo} style={{ width: 48, height: 48 }} />
                  ) : (
                    <span className={styles.logo} style={{ width: 48, height: 48, fontSize: '1.1rem' }} aria-hidden>
                      <Building2 size={20} />
                    </span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p className={styles.resultTitle}>{b.name}</p>
                    <p className={styles.resultSeller}>
                      {b.business_types.map((k) => optionLabel(config.business_types, k)).join(', ')}
                    </p>
                  </div>
                </div>
                {b.description && (
                  <p className={styles.cardText} style={{ marginTop: '0.75rem' }}>
                    {b.description.length > 140 ? `${b.description.slice(0, 140)}…` : b.description}
                  </p>
                )}
                <div className={styles.facts}>
                  <VerificationBadge status={b.verification_status} compact />
                  {b.industry && <span className={styles.chip}>{optionLabel(config.industries, b.industry)}</span>}
                  {b.state && <span className={styles.chip}>{[b.city, b.state].filter(Boolean).join(', ')}</span>}
                  {b.sells && <span className={styles.chip}>Sells</span>}
                  {b.buys && <span className={styles.chip}>Buys</span>}
                </div>
              </Link>
            ))}
          </div>
        ))}

      {pagination && pagination.total_pages > 1 && (
        <nav className={styles.pagination}>
          {page > 1 && (
            <Link href={pageHref(params, page - 1)} className={styles.btnOutline}>
              Previous
            </Link>
          )}
          <span className={styles.listMeta} style={{ alignSelf: 'center' }}>
            Page {page} of {pagination.total_pages}
          </span>
          {page < pagination.total_pages && (
            <Link href={pageHref(params, page + 1)} className={styles.btnOutline}>
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
