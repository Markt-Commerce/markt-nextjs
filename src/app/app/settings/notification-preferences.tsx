'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { saveNotificationPrefsAction } from './actions';
import styles from './privacy/page.module.css';

type Digest = 'immediate' | 'daily' | 'off';

export interface NotificationPrefs {
  channels: { email: boolean; push: boolean };
  categories: {
    orders: boolean;
    payments: boolean;
    offers: boolean;
    messages: boolean;
    social: boolean;
    reviews: boolean;
    marketing: boolean;
  };
  digest: Digest;
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  channels: { email: true, push: true },
  categories: { orders: true, payments: true, offers: true, messages: false, social: false, reviews: false, marketing: false },
  digest: 'immediate',
};

const CATEGORY_LABELS: { key: keyof NotificationPrefs['categories']; label: string }[] = [
  { key: 'orders', label: 'Orders & delivery' },
  { key: 'payments', label: 'Payments & payouts' },
  { key: 'offers', label: 'Offers on your requests' },
  { key: 'messages', label: 'Messages' },
  { key: 'social', label: 'Likes, comments & follows' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'marketing', label: 'News & promotions' },
];

export function NotificationPreferences({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  const persist = (next: NotificationPrefs) => {
    setPrefs(next);
    startTransition(async () => {
      await saveNotificationPrefsAction(next as unknown as Record<string, unknown>);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    });
  };

  const setChannel = (k: keyof NotificationPrefs['channels'], v: boolean) =>
    persist({ ...prefs, channels: { ...prefs.channels, [k]: v } });
  const setCategory = (k: keyof NotificationPrefs['categories'], v: boolean) =>
    persist({ ...prefs, categories: { ...prefs.categories, [k]: v } });

  return (
    <>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', margin: '0 0 1rem', lineHeight: 1.5 }}>
        In-app notifications are always on. Email delivery turns on once it&apos;s enabled on the backend — your choices are
        saved and ready.
      </p>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Channels</p>
        <p className={styles.sectionDesc}>How you want to be reached.</p>
        <ToggleRow label="Email" checked={prefs.channels.email} onChange={(v) => setChannel('email', v)} />
        <ToggleRow label="Push (mobile)" checked={prefs.channels.push} onChange={(v) => setChannel('push', v)} />
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Email me about</p>
        <p className={styles.sectionDesc}>Pick what lands in your inbox (only applies when Email is on).</p>
        {CATEGORY_LABELS.map(({ key, label }) => (
          <ToggleRow
            key={key}
            label={label}
            checked={prefs.categories[key]}
            disabled={!prefs.channels.email}
            onChange={(v) => setCategory(key, v)}
          />
        ))}
      </section>

      <section className={styles.section}>
        <p className={styles.sectionTitle}>Email frequency</p>
        <p className={styles.sectionDesc}>Low-priority updates can be bundled so your inbox stays calm.</p>
        <div className={styles.radioRow}>
          {(
            [
              { value: 'immediate', label: 'As they happen' },
              { value: 'daily', label: 'Daily digest' },
              { value: 'off', label: 'Off' },
            ] as { value: Digest; label: string }[]
          ).map((opt) => (
            <label
              key={opt.value}
              className={`${styles.radioOption} ${prefs.digest === opt.value ? styles.radioOptionActive : ''}`}
            >
              <input
                type="radio"
                checked={prefs.digest === opt.value}
                onChange={() => persist({ ...prefs, digest: opt.value })}
              />
              {opt.label}
            </label>
          ))}
        </div>
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
    </>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.toggleRow} style={disabled ? { opacity: 0.5 } : undefined}>
      <span>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
