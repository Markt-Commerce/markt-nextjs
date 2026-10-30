import Link from 'next/link';
import { BadgeCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getRequest } from '@/lib/api/requests';
import { getBusinessConfig } from '@/lib/api/business';
import { canAcceptOffers } from '@/lib/types/request';
import { formatNaira, formatQuantity, optionLabel } from '@/lib/types/business';
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
  // A procurement request is answered from business mode, where the current
  // buyer/seller role isn't what decides — any seller account can offer.
  const isProcurement = !!request.is_business;
  const isSeller = user.current_role === 'seller' || (isProcurement && user.is_seller);
  const units = isProcurement ? (await getBusinessConfig()).units : [];
  const procurementDetails: [string, string][] = isProcurement
    ? ([
        ['Quantity', formatQuantity(request.quantity, request.unit, units)],
        ['Deliver to', request.delivery_location ?? ''],
        ['Needed by', request.required_delivery_date ? new Date(request.required_delivery_date).toLocaleDateString('en-NG') : ''],
        ...Object.entries(request.specifications ?? {}),
      ].filter(([, v]) => v) as [string, string][])
    : [];
  // Procurement amounts are in naira like the rest of Markt Business; the
  // consumer request pages still show "$", as they did before.
  const money = (amount: number) => (isProcurement ? formatNaira(amount) : `$${amount.toFixed(2)}`);
  const myOffer = user.seller_account ? request.offers.find((o) => o.seller_id === user.seller_account!.id) : undefined;
  const replies = request.offers.length;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        {isProcurement ? (
          <Link href="/app/business/procurement">Procurement</Link>
        ) : (
          <Link href="/app/requests">Requests</Link>
        )}{' '}
        / {request.title}
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

        {procurementDetails.length > 0 && (
          <dl className={styles.procurementTerms}>
            {procurementDetails.map(([label, value]) => (
              <div key={label} className={styles.procurementTerm}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className={styles.metaRow}>
          {isProcurement && <span className={styles.businessChip}>Procurement request</span>}
          {!!request.budget && <span className={styles.budgetChip}>Budget {money(request.budget)}</span>}
          <span className={styles.views}>
            <Eye size={13} /> {request.views} views
          </span>
          <UpvoteButton requestId={request.id} count={request.upvotes} />
        </div>
      </div>

      {/* Seller composer */}
      {isSeller && !isOwner && canAcceptOffers(request) && !myOffer && (
        <OfferForm
          requestId={request.id}
          quantityUnit={isProcurement ? optionLabel(units, request.unit).toLowerCase() : undefined}
        />
      )}

      {myOffer && !isOwner && (
        <div className={styles.myOfferNote}>
          You offered {myOffer.price ? money(myOffer.price) : ''} —{' '}
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
                    <span className={styles.offerPrice}>{money(offer.price)}</span>
                  </div>
                  {offer.proposed_quantity != null && (
                    <p className={styles.offerMessage}>Can supply {formatQuantity(offer.proposed_quantity, request.unit, units)}</p>
                  )}
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
