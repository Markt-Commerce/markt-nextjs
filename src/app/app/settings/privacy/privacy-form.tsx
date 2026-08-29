'use client';

import { useState, useTransition } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { updatePrivacySettingAction } from './actions';
import styles from './page.module.css';

type Visibility = 'public' | 'friends' | 'private';
type MessagesFrom = 'everyone' | 'friends' | 'none';

export interface PrivacySettings {
  profile_visibility: Visibility;
  show_email: boolean;
  show_phone: boolean;
  show_address: boolean;
  allow_messages_from: MessagesFrom;
  show_online_status: boolean;
  show_last_seen: boolean;
  allow_profile_views: boolean;
  allow_friend_requests: boolean;
  allow_tagging: boolean;
  allow_sharing: boolean;
  search_visibility: Visibility;
}

export function PrivacyForm({ initial }: { initial: PrivacySettings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  const save = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    startTransition(async () => {
      await updatePrivacySettingAction(key, value);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Privacy
      </h1>
      <p className={styles.subtitle}>Control who can see your profile and how people can reach you.</p>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Profile visibility</p>
        <p className={styles.sectionDesc}>Who can view your full profile.</p>
        <VisibilityPicker value={settings.profile_visibility} onChange={(v) => save('profile_visibility', v)} />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Contact information</p>
        <p className={styles.sectionDesc}>Choose what other users can see on your profile.</p>
        <ToggleRow label="Show email address" checked={settings.show_email} onChange={(v) => save('show_email', v)} />
        <ToggleRow label="Show phone number" checked={settings.show_phone} onChange={(v) => save('show_phone', v)} />
        <ToggleRow label="Show address" checked={settings.show_address} onChange={(v) => save('show_address', v)} />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Messages</p>
        <p className={styles.sectionDesc}>Who can start a conversation with you.</p>
        <MessagesFromPicker value={settings.allow_messages_from} onChange={(v) => save('allow_messages_from', v)} />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Activity</p>
        <ToggleRow label="Show online status" checked={settings.show_online_status} onChange={(v) => save('show_online_status', v)} />
        <ToggleRow label="Show last seen" checked={settings.show_last_seen} onChange={(v) => save('show_last_seen', v)} />
        <ToggleRow
          label="Allow others to view your profile"
          checked={settings.allow_profile_views}
          onChange={(v) => save('allow_profile_views', v)}
        />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Social</p>
        <ToggleRow
          label="Allow friend requests"
          checked={settings.allow_friend_requests}
          onChange={(v) => save('allow_friend_requests', v)}
        />
        <ToggleRow label="Allow others to tag you" checked={settings.allow_tagging} onChange={(v) => save('allow_tagging', v)} />
        <ToggleRow label="Allow sharing your posts" checked={settings.allow_sharing} onChange={(v) => save('allow_sharing', v)} />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Search visibility</p>
        <p className={styles.sectionDesc}>Who can find your profile through search.</p>
        <VisibilityPicker value={settings.search_visibility} onChange={(v) => save('search_visibility', v)} />
      </section>

      {(pending || justSaved) && (
        <div className={styles.savedBar}>
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> Saved
            </>
          )}
        </div>
      )}
    </div>
  );
}

function VisibilityPicker({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  const options: { value: Visibility; label: string }[] = [
    { value: 'public', label: 'Public' },
    { value: 'friends', label: 'Friends only' },
    { value: 'private', label: 'Private' },
  ];
  return (
    <div className={styles.radioRow}>
      {options.map((opt) => (
        <label key={opt.value} className={cn(styles.radioOption, value === opt.value && styles.radioOptionActive)}>
          <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function MessagesFromPicker({ value, onChange }: { value: MessagesFrom; onChange: (v: MessagesFrom) => void }) {
  const options: { value: MessagesFrom; label: string }[] = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'friends', label: 'Friends only' },
    { value: 'none', label: 'No one' },
  ];
  return (
    <div className={styles.radioRow}>
      {options.map((opt) => (
        <label key={opt.value} className={cn(styles.radioOption, value === opt.value && styles.radioOptionActive)}>
          <input type="radio" checked={value === opt.value} onChange={() => onChange(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
