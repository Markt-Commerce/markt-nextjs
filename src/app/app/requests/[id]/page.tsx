import Link from 'next/link';
import { formatNaira } from '@/lib/format';
import { BadgeCheck, Eye } from 'lucide-react';
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < day) return 'today';
  if (diff < 2 * day) return 'yesterday';
  return `${Math.floor(diff / day)} days ago`;
}

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
  const replies = request.offers.length;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/requests">Requests</Link> / {request.title}
      </nav>

      {/* The ask */}
      <div className={styles.headCard}>
        <span className={cn(styles.statusBadge, styles[STATUS_CLASS[request.status]])}>{request.status.toLowerCase()}</span>

        <div className={styles.asker}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={request.user?.profile_picture_url || '/Logo.png'} alt="" className={styles.askerAvatar} />
          <div>
            <p className={styles.askerName}>{request.user?.username ?? 'A buyer'}</p>
            <p className={styles.askerMeta}>is looking for this · {timeAgo(request.created_at)}</p>
          </div>
        </div>

        <h1 className={styles.title}>{request.title}</h1>
        <p className={styles.description}>{request.description}</p>

        <div className={styles.metaRow}>
          {!!request.budget && <span className={styles.budgetChip}>Budget {formatNaira(request.budget)}</span>}
          <span className={styles.views}>
            <Eye size={13} /> {request.views} views
          </span>
          <UpvoteButton requestId={request.id} count={request.upvotes} />
        </div>
      </div>

      {/* Seller composer */}
      {isSeller && !isOwner && canAcceptOffers(request) && !myOffer && <OfferForm requestId={request.id} />}

      {myOffer && !isOwner && (
        <div className={styles.myOfferNote}>
          You offered {myOffer.price ? formatNaira(myOffer.price) : ''} —{' '}
          <span className={cn(styles.offerStatusBadge, styles[OFFER_STATUS_CLASS[myOffer.status]])}>{myOffer.status.toLowerCase()}</span>
        </div>
      )}

      {/* Offers as a reply thread */}
      <h2 className={styles.sectionTitle}>
        {replies === 0 ? 'Offers' : `${replies} offer${replies === 1 ? '' : 's'}`}
      </h2>

      {replies === 0 ? (
        <div className={styles.emptyOffers}>
          {isOwner ? 'No sellers have replied yet. Hang tight — offers show up here.' : 'Be the first to make an offer.'}
        </div>
      ) : (
        <div className={styles.offerList}>
          {request.offers.map((offer) => (
            <div key={offer.id} className={styles.offerCard}>
              <div className={styles.offerInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={offer.seller?.profile_picture_url ?? '/Logo.png'} alt="" className={styles.avatar} />
                <div className={styles.offerBody}>
                  <div className={styles.offerHead}>
                    <p className={styles.sellerName}>
                      {offer.seller?.shop_name ?? 'Seller'}
                      {offer.seller?.verification_status === 'verified' && (
                        <BadgeCheck size={13} style={{ marginLeft: 4, color: 'var(--info)' }} />
                      )}
                    </p>
                    <span className={styles.offerPrice}>{formatNaira(offer.price)}</span>
                  </div>
                  {offer.message && <p className={styles.offerMessage}>{offer.message}</p>}
                  <span className={cn(styles.offerStatusBadge, styles[OFFER_STATUS_CLASS[offer.status]])}>{offer.status.toLowerCase()}</span>

                  {isOwner && offer.status === 'PENDING' && canAcceptOffers(request) && (
                    <OfferActions requestId={request.id} offerId={offer.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
