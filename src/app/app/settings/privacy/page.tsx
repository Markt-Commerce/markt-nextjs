import { getForwardedCookie } from '@/lib/api/session';
import { getUserSettings } from '@/lib/api/settings';
import { safeFetch } from '@/lib/api/safe';
import { PrivacyForm, type PrivacySettings } from './privacy-form';

const DEFAULTS: PrivacySettings = {
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

export default async function PrivacySettingsPage() {
  const cookie = await getForwardedCookie();
  const stored = await safeFetch(() => getUserSettings(cookie), {});

  return <PrivacyForm initial={{ ...DEFAULTS, ...stored }} />;
}
