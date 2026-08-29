import { UserCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { requireSession } from '@/lib/api/session';
import { AvatarUploader } from './avatar-uploader';
import { ProfileForm } from './profile-form';
import styles from './page.module.css';

export default async function ProfilePage() {
  const user = await requireSession();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <UserCircle size={22} /> My Profile
      </h1>

      <div className={styles.avatarCard}>
        <AvatarUploader avatarUrl={user.profile_picture_url} username={user.username} />
        <div className={styles.avatarInfo}>
          <p className={styles.avatarName}>{user.username}</p>
          <p className={styles.avatarMeta}>
            {user.email} · <span style={{ textTransform: 'capitalize' }}>{user.current_role}</span>
          </p>
          {user.email_verified ? (
            <span className={styles.verifiedTag}>
              <ShieldCheck size={13} /> Email verified
            </span>
          ) : (
            <span className={styles.unverifiedTag}>
              <ShieldAlert size={13} /> Email not verified
            </span>
          )}
        </div>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
