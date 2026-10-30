import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/api/session';
import { getBusinessConfig } from '@/lib/api/business';
import { NewProductForm } from './new-product-form';
import styles from '../../business.module.css';

export default async function NewBusinessProductPage() {
  const user = await requireSession('/app/business/products/new');
  if (!user.is_seller) redirect('/app/business/products');
  const config = await getBusinessConfig();

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/business/products">Products</Link> / New
      </nav>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Add a product</p>
          <h1 className={styles.title}>New business listing</h1>
          <p className={styles.sub}>
            The product goes on Markt like any other, with business terms on top. Add photos from your Media Library
            afterwards.
          </p>
        </div>
      </header>
      <NewProductForm units={config.units} />
    </div>
  );
}
