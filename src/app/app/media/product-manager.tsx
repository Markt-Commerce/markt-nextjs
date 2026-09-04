'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/components/ui/toast';
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
  sku: string;
  categoryId: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  price: '',
  compare_at_price: '',
  stock: '',
  sku: '',
  categoryId: '',
  description: '',
};

function formFrom(product: Product | null): FormState {
  if (!product) return EMPTY_FORM;
  return {
    name: product.name ?? '',
    price: product.price != null ? String(product.price) : '',
    compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : '',
    stock: product.stock != null ? String(product.stock) : '',
    sku: product.sku ?? '',
    categoryId: '',
    description: product.description ?? '',
  };
}

/** A titled group of related fields, like the reference's stacked panels. */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>{title}</div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
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
  // Bumped each time "New product" is pressed so the editor remounts (and clears)
  // even when we're already in new-product mode.
  const [newNonce, setNewNonce] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [galleryPending, startGallery] = useTransition();

  const selected = selectedId ? products.find((p) => p.id === selectedId) ?? null : null;

  const startNew = () => {
    setSelectedId(null);
    setNewNonce((n) => n + 1);
  };

  const attach = (mediaId: number) => {
    if (!selected) return;
    startGallery(async () => {
      const result = await attachMediaAction(selected.id, mediaId);
      if (result.error) toast(result.error, 'error');
      else router.refresh();
    });
  };

  const detach = (imageId: number) => {
    if (!selected) return;
    startGallery(async () => {
      const result = await detachMediaAction(selected.id, imageId);
      if (result.error) toast(result.error, 'error');
      else router.refresh();
    });
  };

  const images = selected?.images ?? [];
  const attachedMediaIds = new Set(images.map((img) => img.media_id));

  const imagesPanel = (
    <Panel title="Product images">
      <div className={styles.imageRow}>
        <button
          type="button"
          className={styles.uploadTileBig}
          onClick={() => setPickerOpen(true)}
          disabled={!selected || galleryPending}
          title={selected ? 'Add an image' : 'Save the product first'}
        >
          <ImagePlus size={22} />
          <span>Upload image</span>
        </button>

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
      </div>
      <p className={styles.panelHint}>
        {selected ? 'The first image is the cover buyers see.' : 'Save the product first, then add images.'}
      </p>
    </Panel>
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Manage Products</h1>
          <p className={styles.subtitle}>Edit your listings and their photos, all in one place.</p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startNew}>
          <Plus size={16} /> New product
        </button>
      </header>

      {/* Product selector */}
      <div className={styles.productRail}>
        <button
          type="button"
          className={cn(styles.railItem, selectedId === null && styles.railItemActive)}
          onClick={startNew}
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

      {/* Keyed so switching product — or pressing "New product" again — remounts
          the editor with fresh field values. */}
      <ProductEditor
        key={selectedId ?? `new-${newNonce}`}
        product={selected}
        categories={categories}
        imagesSlot={imagesPanel}
        onSaved={(id) => {
          setSelectedId(id);
          router.refresh();
        }}
        onDeleted={() => {
          setSelectedId(null);
          router.refresh();
        }}
      />

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
  imagesSlot,
  onSaved,
  onDeleted,
}: {
  product: Product | null;
  categories: CategoryOption[];
  imagesSlot: ReactNode;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFrom(product));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    setError('');
    startTransition(async () => {
      const result = await saveProductAction({
        id: product?.id,
        name: form.name,
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        sku: form.sku,
        description: form.description,
        category_ids: form.categoryId ? [Number(form.categoryId)] : undefined,
      });
      if (result.error) {
        setError(result.error);
        toast(result.error, 'error');
        return;
      }
      toast(product ? 'Product updated.' : 'Product created.', 'success');
      if (result.productId) onSaved(result.productId);
    });
  };

  const remove = () => {
    if (!product) return;
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (result.error) {
        setError(result.error);
        toast(result.error, 'error');
      } else {
        toast('Product deleted.', 'success');
        onDeleted();
      }
    });
  };

  return (
    <>
      <div className={styles.editorLayout}>
        <div className={styles.col}>
          <Panel title="Name & description">
            <label className={styles.field}>
              <span>Product name</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Handmade ceramic mug"
              />
            </label>

            <label className={styles.field}>
              <span>Description</span>
              <textarea
                className={styles.textarea}
                rows={7}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What it is, what makes it special, and anything a buyer should know."
              />
            </label>
          </Panel>

          {imagesSlot}
        </div>

        <div className={styles.col}>
          <Panel title="Category">
            <label className={styles.field}>
              <span>Product category</span>
              <select className={styles.input} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">{product ? 'Keep current' : 'Choose a category'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </Panel>

          <Panel title="Manage stock">
            <label className={styles.field}>
              <span>Stock keeping unit (SKU)</span>
              <input
                className={styles.input}
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="e.g. MUG-01-CLAY"
              />
            </label>
            <label className={styles.field}>
              <span>Units in stock</span>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="0"
              />
            </label>
          </Panel>

          <Panel title="Pricing">
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>Price</span>
                <div className={styles.money}>
                  <span className={styles.moneyPrefix}>₦</span>
                  <input
                    className={cn(styles.input, styles.moneyInput)}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </label>

              <label className={styles.field}>
                <span>Compare-at price</span>
                <div className={styles.money}>
                  <span className={styles.moneyPrefix}>₦</span>
                  <input
                    className={cn(styles.input, styles.moneyInput)}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compare_at_price}
                    onChange={(e) => set('compare_at_price', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </label>
            </div>
            <p className={styles.panelHint}>Set a compare-at price above your price to show a discount.</p>
          </Panel>
        </div>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      <div className={styles.actionBar}>
        {product && (
          <button type="button" className={styles.dangerGhost} onClick={remove} disabled={pending}>
            <Trash2 size={15} /> Delete product
          </button>
        )}
        <button type="button" className={styles.primaryBtn} onClick={save} disabled={pending}>
          <Save size={15} /> {pending ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </>
  );
}
