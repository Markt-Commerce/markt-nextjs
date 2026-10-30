import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getListing } from '@/lib/api/business';
import { getProduct } from '@/lib/api/products';
import { formatNaira, unitSingular } from '@/lib/types/business';
import type { BusinessListing } from '@/lib/types/business';
import { removeListingAction } from '../../actions';
import { ListingTermsForm } from './terms-form';
import styles from '../../business.module.css';

export default async function BusinessProductTermsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params;
  const { created, error } = await searchParams;
  const user = await requireSession(`/app/business/products/${id}`);
  const cookie = await getForwardedCookie();
  const config = await getBusinessConfig();

  let product;
  try {
    product = await getProduct(id, cookie);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  // Only the owner edits terms; the backend enforces it too.
  if (product.seller_user?.id && product.seller_user.id !== user.id) notFound();

  let listing: BusinessListing | null = null;
  try {
    listing = await getListing(id, cookie);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }

  const removeAction = removeListingAction.bind(null, id);

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/business/products">Products</Link> / {product.name}
      </nav>

      {created && !error && (
        <div className={`${styles.notice} ${styles.noticeSuccess}`}>
          <p>
            Listing created. Add photos from your{' '}
            <Link href="/app/media" className={styles.link}>
              Media Library
            </Link>
            .
          </p>
        </div>
      )}
      {error && (
        <div className={`${styles.notice} ${styles.noticeWarning}`}>
          <p>The product was created, but its business terms weren&apos;t saved ({error}). Fill them in below.</p>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Business terms</p>
          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.sub}>
            {formatNaira(product.price)} per {listing ? unitSingular(config.units, listing.unit) : 'unit'} ·{' '}
            {listing ? 'Listed for businesses' : 'Not listed for businesses yet'}
          </p>
        </div>
        {listing && (
          <Link href={`/app/business/listings/${id}`} className={styles.btnOutline}>
            View listing
          </Link>
        )}
      </header>

      <ListingTermsForm productId={id} units={config.units} listing={listing} />

      {listing && (
        <form action={removeAction} className={styles.card} style={{ marginTop: '1.25rem' }}>
          <p className={styles.cardTitle}>Stop listing for businesses</p>
          <p className={styles.cardText} style={{ margin: '0.4rem 0 0.75rem' }}>
            Removes the business terms. The product itself stays on Markt.
          </p>
          <button type="submit" className={styles.btnDanger}>
            Remove business terms
          </button>
        </form>
      )}
    </div>
  );
}
