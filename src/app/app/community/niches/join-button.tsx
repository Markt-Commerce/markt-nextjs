'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/components/ui/toast';
import { toggleNicheMembershipAction } from './actions';
import styles from './niches.module.css';

export function JoinButton({ nicheId, initialMember, size = 'md' }: { nicheId: string; initialMember: boolean; size?: 'sm' | 'md' }) {
  const [member, setMember] = useState(initialMember);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !member;
    setMember(next);
    startTransition(async () => {
      const res = await toggleNicheMembershipAction(nicheId, member);
      if (!res.ok) {
        setMember(!next);
        toast('Could not update that. Try again.', 'error');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.joinBtn, member && styles.joinBtnMember, size === 'sm' && styles.joinBtnSm)}
      aria-pressed={member}
    >
      {member ? (
        <>
          <Check size={14} /> Joined
        </>
      ) : (
        <>
          <Plus size={14} /> Join
        </>
      )}
    </button>
  );
}
