'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';
import styles from './layout.module.css';

export function UserMenu({ displayName, role, avatarUrl }: { displayName: string; role: string; avatarUrl?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.userMenuWrap}>
      <button type="button" className={styles.userButton} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl || '/Logo.png'} alt="Profile" className={styles.avatar} />
        <div className={styles.userMeta}>
          <div className={styles.userName}>{displayName}</div>
          <div className={styles.userRole}>{role}</div>
        </div>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <Link href="/app/settings?tab=profile" onClick={() => setOpen(false)}>
            Profile
          </Link>
          <Link href="/app/settings" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <Link href="/app/support" onClick={() => setOpen(false)}>
            Help &amp; Support
          </Link>
          <hr />
          <form action={logoutAction}>
            <button type="submit">Logout</button>
          </form>
        </div>
      )}
    </div>
  );
}
