import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireSession } from '@/lib/api/session';
import { CreateNicheForm } from '../create-niche-form';
import styles from '../niches.module.css';

export const metadata = { title: 'New community · Markt' };

export default async function NewNichePage() {
  await requireSession('/app/community/niches/new');
  return (
    <div className={styles.page} style={{ maxWidth: 560 }}>
      <Link href="/app/community/niches" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Communities
      </Link>
      <h1 className={styles.title}>Start a community</h1>
      <p className={styles.sub}>Bring people together around something you love.</p>
      <CreateNicheForm />
    </div>
  );
}
