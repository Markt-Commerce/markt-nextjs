import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, MessageCircle, ShoppingCart } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getBusinessProfile, getListing } from '@/lib/api/business';
import { getProduct } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity, unitSingular } from '@/lib/types/business';
import { VerificationBadge } from '../../verification-badge';
import styles from '../../business.module.css';

export default async function BusinessListingPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const user = await requireSession(`/app/business/listings/${productId}`);
  const cookie = await getForwardedCookie();
  const config = await getBusinessConfig();

  let product, terms;
  try {
    [product, terms] = await Promise.all([getProduct(productId, cookie), getListing(productId, cookie)]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <div className={styles.page}>
        <p>This listing couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  const sellerUserId = product.seller_user?.id;
  const business = sellerUserId ? await safeFetch(() => getBusinessProfile(sellerUserId, cookie), null) : null;
  const isMine = sellerUserId === user.id;
  const image = product.images?.[0]?.media;
  const imageUrl = image?.original_url ?? image?.thumbnail_url;
  const unit = unitSingular(config.units, terms.unit);
  const specs = Object.entries(terms.specifications ?? {});

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/business/discover">Discover</Link> / {product.name}
      </nav>

      <div className={styles.split}>
        <div className={styles.form}>
          <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className={styles.resultImage} style={{ aspectRatio: '16 / 8' }} />
            )}
            <div style={{ padding: '1.25rem' }}>
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.resultPrice} style={{ fontSize: '1.3rem', marginTop: '0.6rem' }}>
                {formatNaira(product.price)} <span className={styles.listMeta}>per {unit}</span>{' '}
                {terms.price_negotiable && <span className={`${styles.badge} ${styles.badgeBrand}`}>Negotiable</span>}
              </p>
              {product.description && (
                <p className={styles.cardText} style={{ marginTop: '0.9rem', whiteSpace: 'pre-line' }}>
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <section>
            <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
              Business terms
            </h2>
            <dl className={styles.terms}>
              <div className={styles.term}>
                <dt>Unit</dt>
                <dd>{unit}</dd>
              </div>
              {terms.available_quantity != null && (
                <div className={styles.term}>
                  <dt>Available</dt>
                  <dd>{formatQuantity(terms.available_quantity, terms.unit, config.units)}</dd>
                </div>
              )}
              {terms.min_order_quantity != null && (
                <div className={styles.term}>
                  <dt>Minimum order</dt>
                  <dd>{formatQuantity(terms.min_order_quantity, terms.unit, config.units)}</dd>
                </div>
              )}
              {terms.production_capacity && (
                <div className={styles.term}>
                  <dt>Production capacity</dt>
                  <dd>{terms.production_capacity}</dd>
                </div>
              )}
              {terms.availability && (
                <div className={styles.term}>
                  <dt>Availability</dt>
                  <dd>{terms.availability}</dd>
                </div>
              )}
              {(terms.city || terms.state) && (
                <div className={styles.term}>
                  <dt>Location</dt>
                  <dd>{[terms.city, terms.state].filter(Boolean).join(', ')}</dd>
                </div>
              )}
            </dl>
          </section>

          {specs.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>
                Specifications
              </h2>
              <div className={styles.list}>
                <table className={styles.specTable}>
                  <tbody>
                    {specs.map(([k, v]) => (
                      <tr key={k}>
                        <th scope="row">{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className={styles.form}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>Supplied by</p>
            <div className={styles.profileHead} style={{ margin: '0.6rem 0 0.9rem' }}>
              <span className={styles.logo} style={{ width: 44, height: 44 }} aria-hidden>
                <Building2 size={18} />
              </span>
              <div>
                <p className={styles.listTitle}>{business?.name ?? product.seller?.shop_name ?? 'Business'}</p>
                {business && <VerificationBadge status={business.verification_status} compact />}
              </div>
            </div>
            {business && (
              <Link href={`/app/business/businesses/${business.user_id}`} className={styles.link}>
                View business profile
              </Link>
            )}
          </div>

          {isMine ? (
            <Link href={`/app/business/products/${product.id}`} className={styles.btnOutline}>
              Edit business terms
            </Link>
          ) : (
            <div className={styles.card}>
              <p className={styles.cardTitle}>Interested?</p>
              <p className={styles.cardText} style={{ margin: '0.4rem 0 0.9rem' }}>
                Agree quantity, specifications, price and delivery with the supplier first. Order when you&apos;re both
                happy with the terms.
              </p>
              <div className={styles.form} style={{ gap: '0.5rem' }}>
                {sellerUserId && (
                  <Link
                    href={`/app/chat/start?sellerId=${encodeURIComponent(sellerUserId)}&productId=${encodeURIComponent(product.id)}`}
                    className={styles.btnPrimary}
                  >
                    <MessageCircle size={15} /> Message supplier
                  </Link>
                )}
                <Link href={`/app/marketplace/product/${product.id}`} className={styles.btnOutline}>
                  <ShoppingCart size={15} /> Order through Markt
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
