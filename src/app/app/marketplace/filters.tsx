'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CategoryTreeNode } from '@/lib/types/category';
import styles from './page.module.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

function useParamWriter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };
}

export function SearchSort() {
  const searchParams = useSearchParams();
  const pushParams = useParamWriter();
  const query = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sort') ?? 'newest';
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== query) pushParams({ q: searchInput || null });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className={styles.headerTools}>
      <div className={styles.searchForm}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search Markt…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <SortDropdown value={sortBy} onChange={(value) => pushParams({ sort: value })} />
    </div>
  );
}

/**
 * A custom sort dropdown. A native <select> can't have its open option list
 * styled to match Markt (the browser/OS paints that panel), so this is a
 * button + popover listbox instead — same behaviour, fully themeable.
 */
function SortDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((opt) => opt.value === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.sortWrap} ref={ref}>
      <button
        type="button"
        className={styles.sortTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.sortValue}>{current.label}</span>
        <ChevronDown size={15} className={cn(styles.sortChevron, open && styles.sortChevronOpen)} />
      </button>
      {open && (
        <ul className={styles.sortMenu} role="listbox">
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn(styles.sortOption, active && styles.sortOptionActive)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {active && <Check size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function CategoryChips({ categories }: { categories: CategoryTreeNode[] }) {
  const searchParams = useSearchParams();
  const pushParams = useParamWriter();
  const selected = searchParams.get('category');

  return (
    <div className={styles.chipRow}>
      <button type="button" className={cn(styles.chip, !selected && styles.chipActive)} onClick={() => pushParams({ category: null })}>
        All
      </button>
      {categories.map((node) => (
        <button
          key={node.id}
          type="button"
          className={cn(styles.chip, selected === String(node.id) && styles.chipActive)}
          // The real API filters by category through a different endpoint
          // than price/search, so choosing one clears those rather than
          // silently ignoring them.
          onClick={() => pushParams({ category: selected === String(node.id) ? null : String(node.id), min: null, max: null })}
        >
          {node.name}
        </button>
      ))}
    </div>
  );
}
