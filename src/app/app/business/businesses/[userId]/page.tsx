import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getBusinessProfile, searchListings } from '@/lib/api/business';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity, optionLabel, type BusinessProfile } from '@/lib/types/business';
import { VerificationBadge } from '../../verification-badge';
import styles from '../../business.module.css';

export default async function BusinessProfileViewPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await requireSession(`/app/business/businesses/${userId}`);
  const cookie = await getForwardedCookie();
  const config = await getBusinessConfig();

  let business: BusinessProfile;
  try {
    business = await getBusinessProfile(userId, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <div className={styles.page}>
        <p>This business couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  const listings = business.sells ? await safeFetch(() => searchListings({ sellerUserId: userId, perPage: 24 }, cookie), null) : null;
  const isMe = user.id === userId;
  const location = [business.address, business.city, business.state, business.country].filter(Boolean).join(', ');

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/business/discover?tab=businesses">Businesses</Link> / {business.name}
      </nav>

      {business.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.cover_image_url}
          alt=""
          className={styles.resultImage}
          style={{ aspectRatio: '4 / 1', borderRadius: 14, marginBottom: '1.25rem' }}
        />
      )}

      <header className={styles.header}>
        <div className={styles.profileHead}>
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="" className={styles.logo} />
          ) : (
            <span className={styles.logo} aria-hidden>
              <Building2 size={26} />
            </span>
          )}
          <div>
            <h1 className={styles.title}>{business.name}</h1>
            <div className={styles.facts} style={{ paddingTop: '0.45rem' }}>
              <VerificationBadge status={business.verification_status} compact />
              {business.business_types.map((k) => (
                <span key={k} className={styles.chip}>
                  {optionLabel(config.business_types, k)}
                </span>
              ))}
              {business.industry && <span className={styles.chip}>{optionLabel(config.industries, business.industry)}</span>}
            </div>
          </div>
        </div>
        {isMe ? (
          <Link href="/app/business/profile" className={styles.btnOutline}>
            Edit profile
          </Link>
        ) : (
          <Link href={`/app/chat/start?sellerId=${encodeURIComponent(userId)}`} className={styles.btnPrimary}>
            <MessageCircle size={15} /> Message
          </Link>
        )}
      </header>

      <div className={styles.split}>
        <div>
          {business.description && (
            <div className={styles.card}>
              <p className={styles.cardTitle}>About</p>
              <p className={styles.cardText} style={{ whiteSpace: 'pre-line' }}>
                {business.description}
              </p>
            </div>
          )}

          {business.sells && (
            <>
              <h2 className={styles.sectionTitle}>Products</h2>
              {!listings || listings.items.length === 0 ? (
                <div className={styles.empty}>
                  <p>No business listings yet.</p>
                </div>
              ) : (
                <div className={styles.list}>
                  {listings.items.map((l) => (
                    <Link key={l.id} href={`/app/business/listings/${l.id}`} className={styles.listItem}>
                      {l.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image_url} alt="" className={styles.thumb} />
                      ) : (
                        <span className={styles.thumb} aria-hidden />
                      )}
                      <div className={styles.listMain}>
                        <p className={styles.listTitle}>{l.name}</p>
                        <p className={styles.listMeta}>
                          {[
                            l.business_listing.available_quantity != null &&
                              `${formatQuantity(l.business_listing.available_quantity, l.business_listing.unit, config.units)} available`,
                            l.business_listing.min_order_quantity != null &&
                              `min. ${formatQuantity(l.business_listing.min_order_quantity, l.business_listing.unit, config.units)}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className={styles.listAside}>
                        {formatNaira(l.price)}
                        {l.business_listing.price_negotiable && <span className={styles.listMeta}>negotiable</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className={styles.card}>
          <p className={styles.cardTitle}>Contact</p>
          <ul className={styles.cardText} style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'grid', gap: '0.6rem' }}>
            {location && (
              <li className={styles.iconLine}>
                <MapPin size={13} />
                {location}
              </li>
            )}
            {business.contact_email && (
              <li className={styles.iconLine}>
                <Mail size={13} />
                <a href={`mailto:${business.contact_email}`} className={styles.link}>
                  {business.contact_email}
                </a>
              </li>
            )}
            {business.contact_phone && (
              <li className={styles.iconLine}>
                <Phone size={13} />
                <a href={`tel:${business.contact_phone}`} className={styles.link}>
                  {business.contact_phone}
                </a>
              </li>
            )}
            {business.website && (
              <li className={styles.iconLine}>
                <Globe size={13} />
                <a href={business.website} target="_blank" rel="noopener noreferrer nofollow" className={styles.link}>
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
            <li>{business.buys && business.sells ? 'Buys and sells' : business.sells ? 'Sells' : 'Buys'} on Markt</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
