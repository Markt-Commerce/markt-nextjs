'use client';

import { useActionState, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { createNichePostAction, type NicheFormState } from './actions';
import styles from './niches.module.css';

const initialState: NicheFormState = {};

export function NicheComposer({ nicheId }: { nicheId: string }) {
  const action = createNichePostAction.bind(null, nicheId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        formAction(fd);
        formRef.current?.reset();
        setPreview(null);
      }}
      className={styles.composer}
    >
      <textarea name="caption" className={styles.composerInput} placeholder="Share something with this community…" />

      {preview && (
        <div className={styles.composerPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected" />
          <button
            type="button"
            className={styles.composerPreviewRemove}
            aria-label="Remove photo"
            onClick={() => {
              setPreview(null);
              if (fileRef.current) fileRef.current.value = '';
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {state.error && <p className={styles.formError}>{state.error}</p>}

      <div className={styles.composerBar}>
        <button type="button" className={styles.composerAttach} onClick={() => fileRef.current?.click()}>
          <ImagePlus size={16} /> Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/*"
          hidden
          onChange={(e) => setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)}
        />
        <button type="submit" className={styles.submitBtn} disabled={pending} style={{ marginLeft: 'auto' }}>
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
