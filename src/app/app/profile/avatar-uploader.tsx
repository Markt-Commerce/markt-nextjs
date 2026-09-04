'use client';

import { useRef, useTransition } from 'react';
import type { ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { uploadProfilePictureAction } from './actions';
import styles from './page.module.css';

// Keep avatars well under the Server Action body limit — a portrait photo has
// no business being larger, and this avoids the request failing outright.
const MAX_AVATAR_MB = 8;

export function AvatarUploader({ avatarUrl, username }: { avatarUrl?: string; username: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast(`Image too large — please use one under ${MAX_AVATAR_MB} MB.`, 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const result = await uploadProfilePictureAction(formData);
      if (result.error) toast(result.error, 'error');
      else toast('Profile photo updated.', 'success');
    });
  };

  return (
    <div className={styles.avatarWrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrl || '/Logo.png'} alt={username} className={styles.avatar} />
      <button
        type="button"
        className={styles.avatarUploadBtn}
        style={{ position: 'absolute', bottom: -6, right: -6, padding: '0.35rem', borderRadius: '9999px' }}
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label="Change profile picture"
      >
        <Camera size={13} />
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />
    </div>
  );
}
