'use client';

import { useRef, useTransition } from 'react';
import { UploadCloud, X } from 'lucide-react';
import type { Media } from '@/lib/types/media';
import { toast } from '@/components/ui/toast';
import { uploadMediaAction } from './actions';
import styles from './page.module.css';

const MAX_MEDIA_MB = 50;

/**
 * Reusable image picker — the media library surfaced as a component. Lists the
 * seller's uploaded images (and lets them upload a new one) so it can be reused
 * anywhere an image needs choosing; here it feeds the product gallery.
 */
export function MediaPicker({
  media,
  attachedMediaIds,
  onPick,
  onClose,
  busy,
}: {
  media: Media[];
  attachedMediaIds: Set<number>;
  onPick: (mediaId: number) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const images = media.filter((m) => (m.media_type ?? 'image') === 'image');

  const upload = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_MEDIA_MB * 1024 * 1024) {
      toast(`Image too large — please use one under ${MAX_MEDIA_MB} MB.`, 'error');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt_text', file.name.replace(/\.[^/.]+$/, ''));
    startUpload(async () => {
      const r = await uploadMediaAction(fd);
      if (r.error) toast(r.error, 'error');
      else toast('Image uploaded.', 'success');
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Add an image</h3>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <button type="button" className={styles.uploadTile} onClick={() => inputRef.current?.click()} disabled={uploading}>
          <UploadCloud size={18} /> {uploading ? 'Uploading…' : 'Upload a new image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div className={styles.pickerGrid}>
          {images.map((m) => {
            const used = attachedMediaIds.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className={styles.pickerItem}
                disabled={used || busy}
                onClick={() => onPick(m.id)}
                title={used ? 'Already on this product' : 'Add to product'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbnail_url ?? m.original_url ?? ''} alt={m.alt_text ?? ''} />
                {used && <span className={styles.pickerUsed}>Added</span>}
              </button>
            );
          })}
          {images.length === 0 && <p className={styles.emptyText}>No images yet — upload one above.</p>}
        </div>
      </div>
    </div>
  );
}
