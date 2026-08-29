'use client';

import { useRef, useState, useTransition } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Trash2, UploadCloud } from 'lucide-react';
import type { Media, MediaStats } from '@/lib/types/media';
import { deleteMediaAction, uploadMediaAction } from './actions';
import styles from './page.module.css';

export function MediaLibrary({ initialMedia, stats }: { initialMedia: Media[]; stats: MediaStats | null }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [, startDelete] = useTransition();
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
          <h1 className={styles.title}>Media Library
          </h1>
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
              <article key={media.id} className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.thumbnail_url ?? media.original_url ?? ''} alt={media.alt_text ?? ''} className={styles.thumb} />
                <div className={styles.cardBody}>
                  <p className={styles.filename}>{media.original_filename ?? `media-${media.id}`}</p>
                  <p className={styles.meta}>
                    {((media.file_size ?? 0) / (1024 * 1024)).toFixed(2)} MB · {media.processing_status ?? 'ready'}
                  </p>
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.deleteBtn} onClick={() => startDelete(() => deleteMediaAction(media.id))}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
