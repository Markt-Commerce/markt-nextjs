import Link from 'next/link';
import { ArrowLeft, Clock, KeyRound, PackageCheck } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getPodCode } from '@/lib/api/orders';
import { PodLive } from './pod-live';
import styles from './page.module.css';

/**
 * 10.6 proof-of-delivery, buyer side. Shows the delivery code so the rider can
 * read/enter it to confirm receipt. markt_logistics has no scanner yet, so the
 * code itself (not a QR) is the working handoff — the rider's confirm takes the
 * code string however they learned it.
 */
export default async function OrderPodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const cookie = await getForwardedCookie();

  const pod = await getPodCode(id, cookie).catch(() => null);
  const delivered = !!pod?.delivered;
  const live = !!pod?.ready && !!pod?.code && !delivered;

  return (
    <div className={styles.page}>
      <Link href={`/app/orders/${id}`} className={styles.back}>
        <ArrowLeft size={16} /> Back to order
      </Link>
      <h1 className={styles.title}>Delivery code</h1>

      {/* Keep polling only while a live code could be confirmed by the rider. */}
      {live && <PodLive />}

      {!pod ? (
        <div className={styles.stateBox}>
          <KeyRound size={30} className={styles.stateIconMuted} />
          <p className={styles.stateTitle}>Couldn’t load your code</p>
          <p className={styles.stateText}>Please head back and try again in a moment.</p>
        </div>
      ) : delivered ? (
        <div className={styles.stateBox}>
          <PackageCheck size={30} className={styles.stateIconOk} />
          <p className={styles.stateTitle}>Delivered</p>
          <p className={styles.stateText}>
            Your rider confirmed this order. The code has been used and is no longer needed.
          </p>
        </div>
      ) : !live ? (
        <div className={styles.stateBox}>
          <Clock size={30} className={styles.stateIconMuted} />
          <p className={styles.stateTitle}>No code yet</p>
          <p className={styles.stateText}>
            Your delivery code will appear here once a rider is on the way. This page updates on its own.
          </p>
        </div>
      ) : (
        <div className={styles.codeCard}>
          <p className={styles.codeLede}>Show this code to your rider to confirm delivery</p>
          <p className={styles.code}>{pod.code}</p>
          <p className={styles.codeNote}>
            Your rider enters it to complete the handoff. Only share it once they’ve arrived with your order.
          </p>
        </div>
      )}
    </div>
  );
}
