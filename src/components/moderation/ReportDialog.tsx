'use client';

import { useState, useTransition } from 'react';
import { toast } from '@/components/ui/toast';
import { reportContentAction } from '@/app/app/moderation-actions';
import { REPORT_REASONS, REPORT_REASON_LABELS, type ReportContentType, type ReportReason } from '@/lib/types/moderation';
import styles from './moderation.module.css';

export function ReportDialog({
  contentId,
  contentType,
  label = 'this',
  onClose,
}: {
  contentId: string;
  contentType: ReportContentType;
  label?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!reason) {
      setError('Pick a reason.');
      return;
    }
    startTransition(async () => {
      const res = await reportContentAction(contentId, contentType, reason, details);
      if (res.ok) {
        toast('Thanks — our team will review this.', 'success');
        onClose();
      } else {
        setError(res.error ?? 'Could not submit that report.');
      }
    });
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Report">
        <h2 className={styles.dialogTitle}>Report {label}</h2>
        <p className={styles.dialogSub}>Tell us what&apos;s wrong. Reports are private.</p>

        <div className={styles.reasonList}>
          {REPORT_REASONS.map((r) => (
            <label key={r} className={styles.reason}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {REPORT_REASON_LABELS[r]}
            </label>
          ))}
        </div>

        <textarea
          className={styles.details}
          placeholder="Add any details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.submitBtn} onClick={submit} disabled={pending}>
            {pending ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
