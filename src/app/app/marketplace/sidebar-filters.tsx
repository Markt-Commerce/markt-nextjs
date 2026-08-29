'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CategoryTreeNode } from '@/lib/types/category';
import styles from './page.module.css';

export function SidebarFilters({ categories }: { categories: CategoryTreeNode[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get('q');
  const selectedCategory = searchParams.get('category');
  const minPrice = searchParams.get('min') ?? '';
  const maxPrice = searchParams.get('max') ?? '';

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      if (minInput !== minPrice || maxInput !== maxPrice) pushParams({ min: minInput || null, max: maxInput || null });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minInput, maxInput]);

  const toggleCategory = (id: number) => {
    // The real API filters by category through a different endpoint than
    // price/search — it doesn't support both at once, so picking a category
    // clears price filters rather than silently ignoring them.
    pushParams({ category: selectedCategory === String(id) ? null : String(id), min: null, max: null });
    setMinInput('');
    setMaxInput('');
  };

  const hasFilters = !!(selectedCategory || minPrice || maxPrice || query);

  const clearFilters = () => {
    setMinInput('');
    setMaxInput('');
    router.push(pathname);
  };

  return (
    <>
      <div className={styles.filterGroup}>
        <p className={styles.filterTitle}>Category</p>
        {categories.map((node) => (
          <label key={node.id} className={styles.categoryChip}>
            <input type="checkbox" checked={selectedCategory === String(node.id)} onChange={() => toggleCategory(node.id)} />
            {node.name}
          </label>
        ))}
      </div>

      {!selectedCategory && (
        <div className={styles.filterGroup}>
          <p className={styles.filterTitle}>Price range</p>
          <div className={styles.priceRow}>
            <input
              type="number"
              min={0}
              placeholder="Min"
              className={styles.priceInput}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
            />
            <span>–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              className={styles.priceInput}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
            />
          </div>
        </div>
      )}

      {hasFilters && (
        <button type="button" className={styles.clearBtn} onClick={clearFilters}>
          Clear all filters
        </button>
      )}
    </>
  );
}
