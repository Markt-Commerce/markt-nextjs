'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Check, CheckCircle2, ArrowRight } from 'lucide-react';
import { submitSellerApplicationAction, type ApplicationState } from './actions';
import styles from './page.module.css';

const initialState: ApplicationState = {};

interface Category {
  id: number;
  name: string;
}

const DOCS = [
  { key: 'doc_id', label: 'Government-issued ID', hint: 'Passport, driver’s licence, or national ID.' },
  { key: 'doc_proof', label: 'Proof of address / business', hint: 'A utility bill or business registration.' },
  { key: 'doc_shop', label: 'Shop or product photo', hint: 'A clear photo of what you sell or your storefront.' },
] as const;

export function ApplicationForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(submitSellerApplicationAction, initialState);
  const router = useRouter();

  if (state.success) {
    return (
      <div className={styles.statusCard}>
        <span className={styles.statusIconOk}>
          <CheckCircle2 size={34} />
        </span>
        <h2 className={styles.statusTitle}>Request submitted</h2>
        <p className={styles.statusBody}>
          Thanks — your store request has been sent for review. You’ll get an in-app notification and an email once it’s
          approved, usually within a couple of business days.
        </p>
        <button type="button" className={styles.primaryBtn} onClick={() => router.push('/app/dashboard')}>
          Back to dashboard <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your shop</h2>
        <div className={styles.field}>
          <label htmlFor="shop_name">Shop name</label>
          <input id="shop_name" name="shop_name" className={styles.input} placeholder="e.g. Tech Haven" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="description">What do you sell?</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            rows={3}
            placeholder="A short description buyers will see on your shop."
            required
          />
        </div>
        <div className={styles.field}>
          <label>Categories — pick at least one</label>
          <div className={styles.chipGrid}>
            {categories.map((cat) => (
              <label key={cat.id} className={styles.chip}>
                <input type="checkbox" name="category_ids" value={cat.id} />
                <Check size={13} className={styles.chipCheck} />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Verification documents</h2>
        <p className={styles.sectionLede}>
          All three are required. They’re reviewed privately by our team and never shown on your public shop.
        </p>
        <div className={styles.docGrid}>
          {DOCS.map((doc) => (
            <DocUpload key={doc.key} name={doc.key} label={doc.label} hint={doc.hint} />
          ))}
        </div>
      </section>

      <label className={styles.agreeRow}>
        <input type="checkbox" name="agree" />
        <span>I confirm the information and documents are accurate, and I accept Markt’s seller terms.</span>
      </label>

      {state.error && <p className={styles.error}>{state.error}</p>}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}

function DocUpload({ name, label, hint }: { name: string; label: string; hint: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className={styles.docCard}>
      <div className={styles.docHead}>
        <span className={styles.docLabel}>{label}</span>
        {fileName && <Check size={15} className={styles.docDone} />}
      </div>
      <p className={styles.docHint}>{hint}</p>
      <button type="button" className={styles.docBtn} onClick={() => inputRef.current?.click()}>
        <Upload size={14} /> {fileName ? 'Change file' : 'Upload'}
      </button>
      {fileName && <span className={styles.docFile}>{fileName}</span>}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}
