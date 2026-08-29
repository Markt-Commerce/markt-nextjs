'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import styles from './layout.module.css';

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/app/marketplace/search?q=${encodeURIComponent(q)}`);
      setQuery('');
    }
  };

  return (
    <form className={styles.searchWrap} onSubmit={onSubmit}>
      <div className={styles.searchInputWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search products, sellers, or communities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>
    </form>
  );
}
