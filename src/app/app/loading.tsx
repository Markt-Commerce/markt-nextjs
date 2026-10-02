import styles from './loading.module.css';

/**
 * App-wide navigation fallback. Shown in the main content area while any /app
 * route's server component streams in, so a slow backend reads as "loading",
 * not a frozen page. Routes with a more specific loading.tsx (e.g. marketplace)
 * override this. Deliberately generic — a title bar plus a few content blocks
 * that fit list-, grid-, and detail-shaped pages alike.
 */
export default function AppLoading() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-live="polite">
      <span
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        Loading…
      </span>
      <div className={styles.titleBar} />
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.card} />
        ))}
      </div>
    </div>
  );
}
