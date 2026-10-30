import { BadgeCheck } from 'lucide-react';
import type { BusinessVerificationStatus } from '@/lib/types/business';
import styles from './business.module.css';

const LABELS: Record<BusinessVerificationStatus, { label: string; tone: string }> = {
  VERIFIED: { label: 'Verified', tone: 'badgeSuccess' },
  PENDING: { label: 'Verification pending', tone: 'badgeWarning' },
  UNVERIFIED: { label: 'Not verified', tone: 'badgeMuted' },
  REJECTED: { label: 'Not verified', tone: 'badgeMuted' },
};

/**
 * `compact` shows only a positive status — on cards and search results an
 * unverified business carries no badge rather than a negative one.
 */
export function VerificationBadge({ status, compact = false }: { status: BusinessVerificationStatus; compact?: boolean }) {
  if (compact && status !== 'VERIFIED') return null;
  const { label, tone } = LABELS[status] ?? LABELS.UNVERIFIED;
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {status === 'VERIFIED' && <BadgeCheck size={11} />}
      {label}
    </span>
  );
}
