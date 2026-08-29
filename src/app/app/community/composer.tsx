'use client';

import { useRef, useState, useTransition } from 'react';
import { ImagePlus, Tag, X } from 'lucide-react';
import { createPostAction } from './actions';
import styles from './social-feed/page.module.css';

export interface TaggableProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export function Composer({ products }: { products: TaggableProduct[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tagged, setTagged] = useState<TaggableProduct | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPostAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError('');
        formRef.current?.reset();
        setPreview(null);
        setTagged(null);
      }
    });
  };

  return (
    <form ref={formRef} className={styles.composer} onSubmit={onSubmit}>
      <textarea className={styles.composerInput} name="caption" placeholder="Share something with the community…" />
      {tagged && <input type="hidden" name="product_id" value={tagged.id} />}

      {preview && (
        <div className={styles.composerPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected" />
          <button type="button" className={styles.composerPreviewRemove} onClick={clearImage} aria-label="Remove photo">
            <X size={14} />
          </button>
        </div>
      )}

      {tagged && (
        <div className={styles.taggedChip}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tagged.image || '/Logo.png'} alt="" className={styles.taggedThumb} />
          <div className={styles.taggedInfo}>
            <span className={styles.taggedName}>{tagged.name}</span>
            <span className={styles.taggedPrice}>${tagged.price.toFixed(2)}</span>
          </div>
          <button type="button" className={styles.taggedRemove} onClick={() => setTagged(null)} aria-label="Remove tagged product">
            <X size={14} />
          </button>
        </div>
      )}

      {pickerOpen && products.length > 0 && (
        <div className={styles.picker}>
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.pickerItem}
              onClick={() => {
                setTagged(p);
                setPickerOpen(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image || '/Logo.png'} alt="" className={styles.pickerThumb} />
              <span className={styles.pickerName}>{p.name}</span>
              <span className={styles.pickerPrice}>${p.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className={styles.composerError}>{error}</p>}

      <div className={styles.composerBar}>
        <div className={styles.composerTools}>
          <button type="button" className={styles.composerAttach} onClick={() => fileRef.current?.click()}>
            <ImagePlus size={16} /> Photo
          </button>
          <input ref={fileRef} type="file" name="image" accept="image/*" hidden onChange={onPick} />

          {products.length > 0 && (
            <button
              type="button"
              className={styles.composerAttach}
              onClick={() => setPickerOpen((o) => !o)}
              aria-expanded={pickerOpen}
            >
              <Tag size={16} /> Tag product
            </button>
          )}
        </div>

        <button type="submit" className={styles.composerBtn} disabled={pending}>
          {pending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
