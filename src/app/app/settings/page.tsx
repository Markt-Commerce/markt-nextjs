import type { ReactNode } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { requireSession, getForwardedCookie } from '@/lib/api/session';
import { getUserSettings } from '@/lib/api/settings';
import { safeFetch } from '@/lib/api/safe';
import { AddressForm } from './address-form';
import { RolePanel } from './role-panel';
import { DangerZone } from './danger-zone';
import { BillingsPanel } from './billings-panel';
import { SettingsTabs, type SettingsTab } from './settings-tabs';
import { AvatarUploader } from '../profile/avatar-uploader';
import { ProfileForm } from '../profile/profile-form';
import { PrivacyForm, type PrivacySettings } from './privacy/privacy-form';
import { NotificationPreferences, DEFAULT_NOTIF_PREFS, type NotificationPrefs } from './notification-preferences';
import styles from './page.module.css';

const PRIVACY_DEFAULTS: PrivacySettings = {
  profile_visibility: 'public',
  show_email: false,
  show_phone: false,
  show_address: false,
  allow_messages_from: 'everyone',
  show_online_status: true,
  show_last_seen: true,
  allow_profile_views: true,
  allow_friend_requests: true,
  allow_tagging: true,
  allow_sharing: true,
  search_visibility: 'public',
};

/** Two-column section: label + description on the left, fields on the right. */
function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className={styles.sectionRow}>
      <div className={styles.sectionAside}>
        <h2 className={styles.sectionHeading}>{title}</h2>
        <p className={styles.sectionLede}>{desc}</p>
      </div>
      <div className={styles.sectionFields}>{children}</div>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const user = await requireSession();
  const cookie = await getForwardedCookie();
  const storedSettings = await safeFetch(() => getUserSettings(cookie), {});
  const storedPrivacy = storedSettings;

  const storedNotif = (storedSettings.notification_preferences ?? {}) as Partial<NotificationPrefs>;
  const notifPrefs: NotificationPrefs = {
    channels: { ...DEFAULT_NOTIF_PREFS.channels, ...(storedNotif.channels ?? {}) },
    categories: { ...DEFAULT_NOTIF_PREFS.categories, ...(storedNotif.categories ?? {}) },
    digest: storedNotif.digest ?? DEFAULT_NOTIF_PREFS.digest,
  };

  const tabs: SettingsTab[] = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <>
          <Section title="Profile photo" desc="Shown on your listings, posts, and reviews across Markt.">
            <div className={styles.avatarRow}>
              <AvatarUploader avatarUrl={user.profile_picture_url} username={user.username} />
              <div>
                <p className={styles.avatarName}>{user.username}</p>
                <p className={styles.avatarMeta}>
                  {user.email} · <span style={{ textTransform: 'capitalize' }}>{user.current_role}</span>
                </p>
                {user.email_verified ? (
                  <span className={styles.verifiedTag}><ShieldCheck size={13} /> Email verified</span>
                ) : (
                  <span className={styles.unverifiedTag}><ShieldAlert size={13} /> Email not verified</span>
                )}
              </div>
            </div>
          </Section>
          <Section title="Your details" desc="Update the information people see on your public profile.">
            <ProfileForm user={user} />
          </Section>
        </>
      ),
    },
    {
      id: 'account',
      label: 'Account',
      content: (
        <Section title="Account type" desc="Markt supports both buying and selling from one account.">
          <RolePanel user={user} />
        </Section>
      ),
    },
    {
      id: 'address',
      label: 'Address',
      content: (
        <Section title="Shipping / pickup address" desc="Used for delivery, or for seller pickup logistics if you sell.">
          <AddressForm address={user.address} />
        </Section>
      ),
    },
    {
      id: 'billings',
      label: 'Billings',
      content: <BillingsPanel cookie={cookie} />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: (
        <Section title="Notifications" desc="Choose how and when Markt reaches you.">
          <NotificationPreferences initial={notifPrefs} />
        </Section>
      ),
    },
    {
      id: 'privacy',
      label: 'Privacy',
      content: (
        <Section title="Privacy" desc="Control who can see your profile and how people can reach you.">
          <PrivacyForm initial={{ ...PRIVACY_DEFAULTS, ...storedPrivacy }} />
        </Section>
      ),
    },
    {
      id: 'danger',
      label: 'Danger zone',
      content: <DangerZone />,
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Manage your account settings and preferences.</p>

      <SettingsTabs tabs={tabs} initialTab={tab} />
    </div>
  );
}
