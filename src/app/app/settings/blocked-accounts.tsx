import { listBlocked } from '@/lib/api/moderation';
import { imageOrFallback } from '@/lib/img';
import { UnblockButton } from './unblock-button';
import styles from './page.module.css';

/** Blocked-accounts settings: who you've blocked, with one-tap unblock. */
export async function BlockedAccounts({ cookie }: { cookie?: string }) {
  const blocked = await listBlocked(cookie);

  if (blocked.length === 0) {
    return <p className={styles.emptyText}>You haven&apos;t blocked anyone. Blocked people can&apos;t message you or see your activity.</p>;
  }

  return (
    <div>
      {blocked.map((u) => (
        <div key={u.user_id} className={styles.blockedRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageOrFallback(u.profile_picture)} alt="" className={styles.blockedAvatar} />
          <span className={styles.blockedName}>@{u.username}</span>
          <UnblockButton userId={u.user_id} username={u.username} />
        </div>
      ))}
    </div>
  );
}
