'use client';

import { useActionState } from 'react';
import { Building2, ImagePlus } from 'lucide-react';
import { removeBusinessImageAction, uploadBusinessImageAction, type BusinessFormState } from '../actions';
import type { BusinessImageKind } from '@/lib/api/business';
import styles from '../business.module.css';

const initialState: BusinessFormState = {};

function ImageUpload({ kind, label, url }: { kind: BusinessImageKind; label: string; url?: string | null }) {
  const [state, formAction, pending] = useActionState(uploadBusinessImageAction.bind(null, kind), initialState);
  const isLogo = kind === 'logo';

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className={isLogo ? styles.logo : styles.resultImage} style={isLogo ? undefined : { borderRadius: 10 }} />
      ) : (
        <span className={isLogo ? styles.logo : styles.resultImage} style={isLogo ? undefined : { display: 'grid', placeItems: 'center', borderRadius: 10 }} aria-hidden>
          {isLogo ? <Building2 size={26} /> : <ImagePlus size={24} />}
        </span>
      )}
      <form action={formAction} className={styles.actions} style={{ alignItems: 'center' }}>
        <input type="file" name="file" accept="image/*" aria-label={`Choose ${label.toLowerCase()}`} style={{ fontSize: '0.8rem', maxWidth: '100%' }} />
        <button type="submit" className={styles.btnOutline} disabled={pending}>
          {pending ? 'Uploading…' : url ? 'Replace' : 'Upload'}
        </button>
      </form>
      {url && (
        <form action={removeBusinessImageAction.bind(null, kind)}>
          <button type="submit" className={styles.link} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
            Remove {label.toLowerCase()}
          </button>
        </form>
      )}
      {state.error && <p className={styles.errorText}>{state.error}</p>}
    </div>
  );
}

/** Logo and cover: uploaded files only, never pasted URLs. */
export function BusinessImagesCard({ logoUrl, coverUrl }: { logoUrl?: string | null; coverUrl?: string | null }) {
  return (
    <div className={`${styles.card} ${styles.form}`}>
      <p className={styles.cardTitle}>Logo and cover</p>
      <ImageUpload kind="logo" label="Logo" url={logoUrl} />
      <ImageUpload kind="cover" label="Cover image" url={coverUrl} />
    </div>
  );
}
