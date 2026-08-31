'use client';

import { useRef, useState, useTransition } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Link2, Package, Trash2, UploadCloud, X } from 'lucide-react';
import type { Media, MediaStats } from '@/lib/types/media';
import { attachMediaAction, deleteMediaAction, detachMediaAction, uploadMediaAction } from './actions';
import styles from './page.module.css';

export interface ProductOption {
  id: string;
  name: string;
}

export interface MediaAttachment {
  productId: string;
  productName: string;
  imageId: number;
}

interface MediaLibraryProps {
  initialMedia: Media[];
  stats: MediaStats | null;
  products: ProductOption[];
  attachments: Record<number, MediaAttachment[]>;
}

export function MediaLibrary({ initialMedia, stats, products, attachments }: MediaLibraryProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', file.name.replace(/\.[^/.]+$/, ''));

    setUploadError('');
    startUpload(async () => {
      const result = await uploadMediaAction(formData);
      if (result.error) setUploadError(result.error);
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Media Library</h1>
          {stats && (
            <div className={styles.stats}>
              <span>
                <strong>{stats.total_media}</strong> files
              </span>
              <span>
                <strong>{stats.total_images}</strong> images
              </span>
              <span>
                <strong>{(stats.total_size / (1024 * 1024)).toFixed(1)} MB</strong> total
              </span>
            </div>
          )}
        </div>
        <p className={styles.subtitle}>Your images in one place — see which products use them, and attach them to your inventory.</p>
      </header>

      <div className={styles.body}>
        <div
          className={dragActive ? `${styles.dropzone} ${styles.dropzoneActive}` : styles.dropzone}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <UploadCloud size={28} className={styles.dropzoneIcon} />
          <p>Click to upload, or drag a file here</p>
          <p className={styles.dropzoneHint}>JPEG, PNG, GIF, WebP, MP4, WebM — up to 50MB</p>
          <input ref={inputRef} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={onFileInputChange} />
        </div>

        {uploading && <p className={styles.dropzoneHint}>Uploading…</p>}
        {uploadError && <p className={styles.errorMessage}>{uploadError}</p>}

        {initialMedia.length === 0 && <div className={styles.emptyState}>No media uploaded yet.</div>}

        {initialMedia.length > 0 && (
          <div className={styles.grid}>
            {initialMedia.map((media) => (
              <MediaCard key={media.id} media={media} products={products} attached={attachments[media.id] ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaCard({ media, products, attached }: { media: Media; products: ProductOption[]; attached: MediaAttachment[] }) {
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');

  const attachedIds = new Set(attached.map((a) => a.productId));
  const attachable = products.filter((p) => !attachedIds.has(p.id));
  const isImage = (media.media_type ?? 'image') === 'image';

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError('');
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else setPicking(false);
    });
  };

  return (
    <article className={styles.card}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.thumbnail_url ?? media.original_url ?? ''} alt={media.alt_text ?? ''} className={styles.thumb} />
      <div className={styles.cardBody}>
        <p className={styles.filename}>{media.original_filename ?? `media-${media.id}`}</p>
        <p className={styles.meta}>
          {((media.file_size ?? 0) / (1024 * 1024)).toFixed(2)} MB · {media.processing_status ?? 'ready'}
        </p>

        {/* Which products use this image. */}
        <div className={styles.attachments}>
          {attached.length === 0 ? (
            <span className={styles.unattached}>
              <Package size={12} /> Not used on any product
            </span>
          ) : (
            attached.map((a) => (
              <span key={a.imageId} className={styles.attachChip}>
                <Package size={12} />
                <span className={styles.attachName}>{a.productName}</span>
                <button
                  type="button"
                  className={styles.attachRemove}
                  disabled={pending}
                  aria-label={`Detach from ${a.productName}`}
                  onClick={() => run(() => detachMediaAction(a.productId, a.imageId))}
                >
                  <X size={11} />
                </button>
              </span>
            ))
          )}
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.cardActions}>
          {isImage && attachable.length > 0 && (
            <div className={styles.attachControl}>
              {picking ? (
                <select
                  className={styles.attachSelect}
                  disabled={pending}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) run(() => attachMediaAction(e.target.value, media.id));
                  }}
                >
                  <option value="" disabled>
                    Choose a product…
                  </option>
                  {attachable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <button type="button" className={styles.attachBtn} disabled={pending} onClick={() => setPicking(true)}>
                  <Link2 size={14} /> Attach to product
                </button>
              )}
            </div>
          )}

          <button type="button" className={styles.deleteBtn} disabled={pending} onClick={() => startTransition(() => deleteMediaAction(media.id))}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}
