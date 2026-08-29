'use client';

import { useRef, useState, useTransition } from 'react';
import type { ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { uploadProfilePictureAction } from './actions';
import styles from './page.module.css';

export function AvatarUploader({ avatarUrl, username }: { avatarUrl?: string; username: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setError('');
    startTransition(async () => {
      const result = await uploadProfilePictureAction(formData);
      if (result.error) setError(result.error);
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
      {error && (
        <p className={styles.errorText} style={{ position: 'absolute', top: '100%', width: '12rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
