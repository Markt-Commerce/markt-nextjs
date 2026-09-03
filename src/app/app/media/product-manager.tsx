'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Media } from '@/lib/types/media';
import type { Product } from '@/lib/types/product';
import { primaryImageUrl } from '@/lib/types/product';
import { attachMediaAction, deleteProductAction, detachMediaAction, saveProductAction } from './actions';
import { MediaPicker } from './media-picker';
import styles from './page.module.css';

export interface CategoryOption {
  id: number;
  name: string;
}

interface FormState {
  name: string;
  price: string;
  compare_at_price: string;
  stock: string;
  categoryId: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: '', price: '', compare_at_price: '', stock: '', categoryId: '', description: '' };

function formFrom(product: Product | null): FormState {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name ?? '',
    price: product.price != null ? String(product.price) : '',
    compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
    stock: product.stock != null ? String(product.stock) : '',
    categoryId: '',
    description: product.description ?? '',
  };
}

export function ProductManager({
  products,
  media,
  categories,
}: {
  products: Product[];
  media: Media[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [galleryPending, startGallery] = useTransition();
  const [galleryError, setGalleryError] = useState('');

  const selected = selectedId ? products.find((p) => p.id === selectedId) ?? null : null;

  const attach = (mediaId: number) => {
    if (!selected) return;
    setGalleryError('');
    startGallery(async () => {
      const result = await attachMediaAction(selected.id, mediaId);
      if (result.error) setGalleryError(result.error);
      else router.refresh();
    });
  };

  const detach = (imageId: number) => {
    if (!selected) return;
    setGalleryError('');
    startGallery(async () => {
      const result = await detachMediaAction(selected.id, imageId);
      if (result.error) setGalleryError(result.error);
      else router.refresh();
    });
  };

  const images = selected?.images ?? [];
  const mainImage = selected ? primaryImageUrl(selected) : undefined;
  const attachedMediaIds = new Set(images.map((img) => img.media_id));

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Manage Products</h1>
          <p className={styles.subtitle}>Edit your listings and their photos, all in one place.</p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={() => setSelectedId(null)}>
          <Plus size={16} /> New product
        </button>
      </header>

      {/* Product selector */}
      <div className={styles.productRail}>
        <button
          type="button"
          className={cn(styles.railItem, selectedId === null && styles.railItemActive)}
          onClick={() => setSelectedId(null)}
        >
          <span className={styles.railThumbNew}><Plus size={16} /></span>
          <span className={styles.railName}>New product</span>
        </button>
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            className={cn(styles.railItem, selectedId === p.id && styles.railItemActive)}
            onClick={() => setSelectedId(p.id)}
          >
            {primaryImageUrl(p) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.railThumb} src={primaryImageUrl(p)} alt="" />
            ) : (
              <span className={styles.railThumbEmpty}><Package size={15} /></span>
            )}
            <span className={styles.railName}>{p.name}</span>
          </button>
        ))}
      </div>

      <div className={styles.managerGrid}>
        {/* Keyed so switching product remounts the editor with fresh field values. */}
        <ProductEditor
          key={selectedId ?? 'new'}
          product={selected}
          categories={categories}
          onSaved={(id) => {
            setSelectedId(id);
            router.refresh();
          }}
          onDeleted={() => {
            setSelectedId(null);
            router.refresh();
          }}
        />

        {/* Image gallery */}
        <section className={styles.galleryCard}>
          <h2 className={styles.cardTitle}>Product images</h2>
          <p className={styles.cardLede}>The first image is the cover buyers see.</p>

          <div className={styles.galleryMain}>
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt="" className={styles.galleryMainImg} />
            ) : (
              <div className={styles.galleryEmpty}>
                <ImagePlus size={26} />
                <span>{selected ? 'No images yet' : 'Save the product first, then add images'}</span>
              </div>
            )}
          </div>

          <div className={styles.thumbStrip}>
            {images.map((img) => (
              <div key={img.id} className={styles.galThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.media?.thumbnail_url ?? img.media?.original_url ?? ''} alt={img.alt_text ?? ''} />
                <button
                  type="button"
                  className={styles.galThumbRemove}
                  onClick={() => detach(img.id)}
                  disabled={galleryPending}
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {selected && (
              <button type="button" className={styles.addThumb} onClick={() => setPickerOpen(true)} disabled={galleryPending}>
                <Plus size={18} />
                <span>Add</span>
              </button>
            )}
          </div>

          {galleryError && <p className={styles.errorMessage}>{galleryError}</p>}
        </section>
      </div>

      {pickerOpen && selected && (
        <MediaPicker
          media={media}
          attachedMediaIds={attachedMediaIds}
          busy={galleryPending}
          onPick={(mediaId) => {
            attach(mediaId);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  onSaved,
  onDeleted,
}: {
  product: Product | null;
  categories: CategoryOption[];
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFrom(product));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveProductAction({
        id: product?.id,
        name: form.name,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        description: form.description,
        category_ids: form.categoryId ? [Number(form.categoryId)] : undefined,
      });
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }
      setMessage({ type: 'ok', text: 'Saved' });
      if (result.productId) onSaved(result.productId);
    });
  };

  const remove = () => {
    if (!product) return;
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (result.error) setMessage({ type: 'error', text: result.error });
      else onDeleted();
    });
  };

  return (
    <section className={styles.editorCard}>
      <h2 className={styles.cardTitle}>{product ? 'Product details' : 'New product'}</h2>
      <p className={styles.cardLede}>{product ? 'Update your listing and save changes.' : 'Add a product to your shop.'}</p>

      <div className={styles.fieldGrid}>
        <label className={cn(styles.field, styles.fieldWide)}>
          <span>Product name</span>
          <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Handmade ceramic mug" />
        </label>

        <label className={styles.field}>
          <span>Price</span>
          <input className={styles.input} type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
        </label>

        <label className={styles.field}>
          <span>Compare-at price</span>
          <input className={styles.input} type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} placeholder="Optional" />
        </label>

        <label className={styles.field}>
          <span>Stock</span>
          <input className={styles.input} type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
        </label>

        <label className={styles.field}>
          <span>Category</span>
          <select className={styles.input} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">{product ? 'Keep current' : 'Choose a category'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className={cn(styles.field, styles.fieldWide)}>
          <span>Description</span>
          <textarea className={styles.textarea} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell buyers what makes it special." />
        </label>
      </div>

      {message && <p className={message.type === 'error' ? styles.errorMessage : styles.successMessage}>{message.text}</p>}

      <div className={styles.editorActions}>
        {product && (
          <button type="button" className={styles.dangerGhost} onClick={remove} disabled={pending}>
            <Trash2 size={15} /> Delete
          </button>
        )}
        <button type="button" className={styles.primaryBtn} onClick={save} disabled={pending}>
          <Save size={15} /> {pending ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </section>
  );
}
