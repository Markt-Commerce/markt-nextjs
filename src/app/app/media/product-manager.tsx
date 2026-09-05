'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Boxes, ImagePlus, Package, PencilLine, Plus, Save, Trash2, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatNaira } from '@/lib/format';
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
export interface CategoryGroup {
  id: number;
  name: string;
  children: CategoryOption[];
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

const EMPTY_FORM: FormState = { name: '', price: '', compare_at_price: '', stock: '', sku: '', categoryId: '', description: '' };

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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>{title}</div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

/** Stock status derived from quantity on hand. */
function stockLabel(stock: number): { text: string; cls: string } {
  if (stock <= 0) return { text: 'Out of stock', cls: styles.stkOut };
  if (stock <= 5) return { text: `Low · ${stock} left`, cls: styles.stkLow };
  return { text: `${stock} in stock`, cls: styles.stkOk };
}

export function ProductManager({
  products,
  media,
  categories,
  orderedByProduct = {},
}: {
  products: Product[];
  media: Media[];
  categories: CategoryGroup[];
  orderedByProduct?: Record<string, number>;
}) {
  const router = useRouter();
  // 'new' = add modal, a product id = edit modal, null = closed.
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const editingProduct = editingId && editingId !== 'new' ? products.find((p) => p.id === editingId) ?? null : null;
  const modalOpen = editingId !== null;

  const totalStock = products.reduce((n, p) => n + (p.stock ?? 0), 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock <= 0).length;
  const unitsOrdered = Object.values(orderedByProduct).reduce((a, b) => a + b, 0);

  const stats = [
    { icon: Boxes, label: 'Products', value: products.length },
    { icon: Package, label: 'Units in stock', value: totalStock },
    { icon: TriangleAlert, label: 'Low / out of stock', value: lowStock + outOfStock },
    { icon: Boxes, label: 'Units ordered', value: unitsOrdered },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Inventory</h1>
          <p className={styles.subtitle}>Your products, stock on hand, and what buyers have ordered.</p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={() => setEditingId('new')}>
          <Plus size={16} /> Add product
        </button>
      </header>

      <div className={styles.statRow}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}><s.icon size={16} /></span>
            <div>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 ? (
        <div className={styles.invEmpty}>
          <Package size={26} />
          <p>No products yet. Add your first one to start selling.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => setEditingId('new')}>
            <Plus size={16} /> Add product
          </button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.invTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th className={styles.numCol}>Ordered</th>
                <th>Stock</th>
                <th className={styles.numCol}>Price</th>
                <th className={styles.actionCol}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = primaryImageUrl(p);
                const st = stockLabel(p.stock ?? 0);
                return (
                  <tr key={p.id} className={styles.invRow} onClick={() => setEditingId(p.id)}>
                    <td>
                      <div className={styles.invProduct}>
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className={styles.invThumb} />
                        ) : (
                          <span className={styles.invThumb} aria-hidden />
                        )}
                        <span className={styles.invName}>{p.name}</span>
                      </div>
                    </td>
                    <td className={styles.numCol}>{orderedByProduct[p.id] ?? 0}</td>
                    <td>
                      <span className={cn(styles.stockBadge, st.cls)}>{st.text}</span>
                    </td>
                    <td className={styles.numCol}>{formatNaira(p.price)}</td>
                    <td className={styles.actionCol}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(p.id);
                        }}
                        aria-label={`Edit ${p.name}`}
                      >
                        <PencilLine size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => setEditingId(null)}>
          <div className={cn(styles.modal, styles.editorModal)} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>{editingProduct ? 'Edit product' : 'Add product'}</h3>
              <button type="button" className={styles.modalClose} onClick={() => setEditingId(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.editorModalBody}>
              <ProductEditor
                key={editingId ?? 'new'}
                product={editingProduct}
                categories={categories}
                media={media}
                onSaved={(id) => {
                  // Keep the modal open on the just-created product so images can
                  // be added; the refresh pulls its new data in.
                  setEditingId(id);
                  router.refresh();
                }}
                onDeleted={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  media,
  onSaved,
  onDeleted,
}: {
  product: Product | null;
  categories: CategoryGroup[];
  media: Media[];
  onSaved: (id: string) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFrom(product));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [galleryPending, startGallery] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const images = product?.images ?? [];
  const attachedMediaIds = new Set(images.map((img) => img.media_id));

  const attach = (mediaId: number) => {
    if (!product) return;
    startGallery(async () => {
      const result = await attachMediaAction(product.id, mediaId);
      if (result.error) toast(result.error, 'error');
      else router.refresh();
    });
  };
  const detach = (imageId: number) => {
    if (!product) return;
    startGallery(async () => {
      const result = await detachMediaAction(product.id, imageId);
      if (result.error) toast(result.error, 'error');
      else router.refresh();
    });
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
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
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!product || busy) return;
    setBusy(true);
    try {
      const result = await deleteProductAction(product.id);
      if (result.error) {
        setError(result.error);
        toast(result.error, 'error');
      } else {
        toast('Product deleted.', 'success');
        onDeleted();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.editorLayout}>
        <div className={styles.col}>
          <Panel title="Name & description">
            <label className={styles.field}>
              <span>Product name</span>
              <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Handmade ceramic mug" />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea
                className={styles.textarea}
                rows={6}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What it is, what makes it special, and anything a buyer should know."
              />
            </label>
          </Panel>

          <Panel title="Product images">
            <div className={styles.imageRow}>
              <button
                type="button"
                className={styles.uploadTileBig}
                onClick={() => setPickerOpen(true)}
                disabled={!product || galleryPending}
                title={product ? 'Add an image' : 'Save the product first'}
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
            <p className={styles.panelHint}>{product ? 'The first image is the cover buyers see.' : 'Save the product first, then add images.'}</p>
          </Panel>
        </div>

        <div className={styles.col}>
          <Panel title="Category">
            <label className={styles.field}>
              <span>Product category</span>
              <select className={styles.input} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">{product ? 'Keep current' : 'Choose a category'}</option>
                {categories.map((group) =>
                  group.children.length > 0 ? (
                    <optgroup key={group.id} label={group.name}>
                      <option value={group.id}>All {group.name}</option>
                      {group.children.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  )
                )}
              </select>
            </label>
          </Panel>

          <Panel title="Manage stock">
            <label className={styles.field}>
              <span>Stock keeping unit (SKU)</span>
              <input className={styles.input} value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. MUG-01-CLAY" />
            </label>
            <label className={styles.field}>
              <span>Units in stock</span>
              <input className={styles.input} type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
            </label>
          </Panel>

          <Panel title="Pricing">
            <div className={styles.row2}>
              <label className={styles.field}>
                <span>Price</span>
                <div className={styles.money}>
                  <span className={styles.moneyPrefix}>₦</span>
                  <input className={cn(styles.input, styles.moneyInput)} type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
                </div>
              </label>
              <label className={styles.field}>
                <span>Compare-at price</span>
                <div className={styles.money}>
                  <span className={styles.moneyPrefix}>₦</span>
                  <input className={cn(styles.input, styles.moneyInput)} type="number" min="0" step="0.01" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} placeholder="Optional" />
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
          <button type="button" className={styles.dangerGhost} onClick={remove} disabled={busy}>
            <Trash2 size={15} /> Delete product
          </button>
        )}
        <button type="button" className={styles.primaryBtn} onClick={save} disabled={busy}>
          <Save size={15} /> {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>

      {pickerOpen && product && (
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
    </>
  );
}
