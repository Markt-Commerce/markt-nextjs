import { Bike, Phone, Star, User } from 'lucide-react';
import type { TrackingDelivery } from '@/lib/types/order';
import styles from './page.module.css';

/**
 * Who is bringing it. Mirrors the mobile RiderCard: the buyer gets a name, a
 * face, what the rider is doing right now, and a way to call — rather than a
 * bare "picked up". Degrades to just the step line before a rider is found.
 */
const STEP_LABEL: Record<string, string> = {
  ARRIVED_PICKUP: 'At the shop, collecting your order',
  PICKED_UP: 'Has your order',
  EN_ROUTE_TO_DROPOFF: 'On the way to you',
  DELIVERED_PENDING_QR: 'At your address — have your code ready',
  COMPLETED: 'Delivered',
};

function stepLabel(delivery: TrackingDelivery): string {
  const step = delivery.logistical_status;
  // No step yet means accepted and not started: the rider is on their way to
  // the shop — a real thing to say, better than echoing "ACCEPTED".
  if (!step) return 'Heading to the shop';
  return STEP_LABEL[step] ?? step.replace(/_/g, ' ').toLowerCase();
}

function vehicleLabel(vehicle?: string | null): string | null {
  if (!vehicle) return null;
  const word = vehicle.toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function RiderCard({ delivery }: { delivery: TrackingDelivery }) {
  const rider = delivery.rider;
  const name = rider?.name?.trim();
  const vehicle = vehicleLabel(rider?.vehicle_type);

  return (
    <div className={styles.riderCard}>
      <div className={styles.riderAvatar}>
        {rider?.profile_picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rider.profile_picture} alt="" className={styles.riderAvatarImg} />
        ) : (
          <User size={22} />
        )}
      </div>

      <div className={styles.riderBody}>
        <p className={styles.riderName}>{name || 'Your rider'}</p>
        <p className={styles.riderStep}>{stepLabel(delivery)}</p>
        {(vehicle || rider?.rating != null) && (
          <div className={styles.riderMeta}>
            {vehicle && (
              <span className={styles.riderMetaItem}>
                <Bike size={13} /> {vehicle}
              </span>
            )}
            {rider?.rating != null && (
              <span className={styles.riderMetaItem}>
                <Star size={13} /> {rider.rating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {rider?.phone_number && (
        <a href={`tel:${rider.phone_number}`} className={styles.riderCall} aria-label="Call rider">
          <Phone size={16} />
        </a>
      )}
    </div>
  );
}
