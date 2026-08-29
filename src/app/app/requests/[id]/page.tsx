import Link from 'next/link';
import { Eye, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getRequest } from '@/lib/api/requests';
import { canAcceptOffers } from '@/lib/types/request';
import { OfferForm } from './offer-form';
import { UpvoteButton } from './upvote-button';
import { OfferActions } from './offer-actions';
import styles from './page.module.css';

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'statusOpen',
  FULFILLED: 'statusFulfilled',
  CLOSED: 'statusClosed',
  EXPIRED: 'statusExpired',
};

const OFFER_STATUS_CLASS: Record<string, string> = {
  PENDING: 'statusOpen',
  ACCEPTED: 'statusFulfilled',
  REJECTED: 'statusClosed',
  WITHDRAWN: 'statusClosed',
};

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = await getForwardedCookie();
  const user = await requireSession();

  let request;
  try {
    request = await getRequest(id, cookie);
  } catch {
    return (
      <div className={styles.page}>
        <p>This request couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  const isOwner = request.user_id === user.id;
  const isSeller = user.current_role === 'seller';
  const myOffer = user.seller_account ? request.offers.find((o) => o.seller_id === user.seller_account!.id) : undefined;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/requests">Requests</Link> / {request.title}
      </nav>

      <div className={styles.headCard}>
        <div className={styles.headRow}>
          <h1 className={styles.title}>{request.title}</h1>
          <span className={cn(styles.statusBadge, styles[STATUS_CLASS[request.status]])}>{request.status.toLowerCase()}</span>
        </div>
        <p className={styles.description}>{request.description}</p>
        <div className={styles.metaRow}>
          {!!request.budget && <span className={styles.budgetTag}>Budget: ${request.budget.toFixed(2)}</span>}
          <span>
            <Eye size={13} style={{ display: 'inline', marginRight: 3 }} />
            {request.views} views
          </span>
          <UpvoteButton requestId={request.id} count={request.upvotes} />
        </div>
      </div>

      {isSeller && !isOwner && canAcceptOffers(request) && !myOffer && <OfferForm requestId={request.id} />}

      {myOffer && !isOwner && (
        <div className={styles.myOfferNote}>
          You offered {myOffer.price ? `$${myOffer.price.toFixed(2)}` : ''} — status:{' '}
          <span className={cn(styles.offerStatusBadge, styles[OFFER_STATUS_CLASS[myOffer.status]])}>{myOffer.status.toLowerCase()}</span>
        </div>
      )}

      <h2 className={styles.sectionTitle}>Offers ({request.offers.length})</h2>

      {request.offers.length === 0 && <div className={styles.emptyState}>No offers yet.</div>}

      <div className={styles.offerList}>
        {request.offers.map((offer) => (
          <div key={offer.id} className={styles.offerCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={offer.seller?.profile_picture_url ?? '/Logo.png'} alt="" className={styles.avatar} />
            <div className={styles.offerBody}>
              <div className={styles.offerHead}>
                <p className={styles.sellerName}>
                  {offer.seller?.shop_name ?? 'Seller'}
                  {offer.seller?.verification_status === 'verified' && (
                    <ShieldCheck size={13} style={{ display: 'inline', marginLeft: 4, color: '#059669' }} />
                  )}
                </p>
                <span className={styles.offerPrice}>${offer.price.toFixed(2)}</span>
              </div>
              {offer.message && <p className={styles.offerMessage}>{offer.message}</p>}
              <span className={cn(styles.offerStatusBadge, styles[OFFER_STATUS_CLASS[offer.status]])}>{offer.status.toLowerCase()}</span>

              {isOwner && offer.status === 'PENDING' && canAcceptOffers(request) && (
                <OfferActions requestId={request.id} offerId={offer.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
