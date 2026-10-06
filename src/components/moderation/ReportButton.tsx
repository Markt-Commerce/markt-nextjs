'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { ReportDialog } from './ReportDialog';
import type { ReportContentType } from '@/lib/types/moderation';
import styles from './moderation.module.css';

/** A plain "Report" text button that opens the report dialog for any content. */
export function ReportButton({
  contentId,
  contentType,
  label,
}: {
  contentId: string;
  contentType: ReportContentType;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.reportLink} onClick={() => setOpen(true)}>
        <Flag size={13} /> Report
      </button>
      {open && <ReportDialog contentId={contentId} contentType={contentType} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}
