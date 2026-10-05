'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { toast } from '@/components/ui/toast';
import { setLeaderboardOptOutAction } from '../actions';

export function OptOutToggle({ initialOptOut }: { initialOptOut: boolean }) {
  const [optOut, setOptOut] = useState(initialOptOut);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onChange = (next: boolean) => {
    setOptOut(next);
    startTransition(async () => {
      const res = await setLeaderboardOptOutAction(next);
      if (!res.ok) {
        setOptOut(!next);
        toast('Could not update that. Try again.', 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.5rem 0.25rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
      }}
    >
      <span>Hide me from the leaderboard</span>
      <ToggleSwitch checked={optOut} onChange={onChange} ariaLabel="Hide me from the leaderboard" />
    </div>
  );
}
