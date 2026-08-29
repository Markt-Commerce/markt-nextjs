'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
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
      <select className={styles.sortSelect} value={sortBy} onChange={(e) => pushParams({ sort: e.target.value })}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
