import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PackagePlus } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getBusinessConfig, getMyBusiness, searchListings } from '@/lib/api/business';
import { listMyProducts } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { formatNaira, formatQuantity } from '@/lib/types/business';
import styles from '../business.module.css';

export default async function BusinessProductsPage() {
  const user = await requireSession('/app/business/products');
  const cookie = await getForwardedCookie();
  const [config, mine] = await Promise.all([getBusinessConfig(), safeFetch(() => getMyBusiness(cookie), null)]);
  if (!mine?.profile || !mine.business_tag) redirect('/app/business/onboarding');

  if (!user.is_seller) {
    return (
      <div className={`${styles.page} ${styles.narrow}`}>
        <h1 className={styles.title}>Products</h1>
        <div className={styles.empty} style={{ marginTop: '1.25rem' }}>
          <p>Listing products needs a seller account. Add one in Settings — it uses the same login.</p>
          <Link href="/app/settings" className={styles.btnPrimary}>
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // One call for every listing's terms rather than one per product.
  const [products, listings] = await Promise.all([
    safeFetch(() => listMyProducts(cookie), []),
    safeFetch(() => searchListings({ sellerUserId: user.id, perPage: 100 }, cookie), null),
  ]);
  const termsByProduct = new Map((listings?.items ?? []).map((l) => [l.id, l.business_listing]));
  const visible = products.filter((p) => p.status !== 'deleted');
  const withTerms = visible.filter((p) => termsByProduct.has(p.id)).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Products</p>
          <h1 className={styles.title}>Business listings</h1>
          <p className={styles.sub}>
            Add business terms — unit, quantity, minimum order — to the products you want businesses to find. Products
            without them still sell on Markt as usual.
          </p>
        </div>
        <Link href="/app/business/products/new" className={styles.btnPrimary}>
          <PackagePlus size={15} /> Add a product
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>You haven&apos;t listed any products yet.</p>
          <Link href="/app/business/products/new" className={styles.btnPrimary}>
            Add your first product
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.listMeta} style={{ marginBottom: '0.75rem' }}>
            {withTerms} of {visible.length} product{visible.length === 1 ? '' : 's'} listed for businesses
          </p>
          <div className={styles.list}>
            {visible.map((p) => {
              const terms = termsByProduct.get(p.id);
              const image = p.images?.[0]?.media;
              return (
                <Link key={p.id} href={`/app/business/products/${p.id}`} className={styles.listItem}>
                  {image?.thumbnail_url || image?.original_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.thumbnail_url ?? image.original_url} alt="" className={styles.thumb} />
                  ) : (
                    <span className={styles.thumb} aria-hidden />
                  )}
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{p.name}</p>
                    <p className={styles.listMeta}>
                      {terms
                        ? [
                            terms.available_quantity != null && `${formatQuantity(terms.available_quantity, terms.unit, config.units)} available`,
                            terms.min_order_quantity != null && `min. ${formatQuantity(terms.min_order_quantity, terms.unit, config.units)}`,
                            terms.price_negotiable && 'negotiable',
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Business terms set'
                        : p.status && p.status !== 'active'
                          ? `${p.status.replace(/_/g, ' ')} · not visible to businesses`
                          : 'No business terms yet'}
                    </p>
                  </div>
                  <span className={styles.listAside}>
                    {formatNaira(p.price)}
                    <br />
                    {terms ? (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Listed</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>Add terms</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
