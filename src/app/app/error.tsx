'use client';

import { useEffect } from 'react';
import { RotateCcw, Unplug } from 'lucide-react';

/**
 * Catch-all safety net for the signed-in app. Most reads degrade to empty
 * states via safeFetch, so reaching here means an unguarded server error
 * slipped through (e.g. the backend went down mid-request). Rather than the
 * raw Next.js error overlay, show a calm "can't reach Markt right now" card
 * with a retry that re-runs the failed render.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] render error:', error);
  }, [error]);

  return (
    <div
      style={{
        maxWidth: '30rem',
        margin: '4rem auto',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      <div
        style={{
          width: '3rem',
          height: '3rem',
          margin: '0 auto 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-full)',
          background: 'var(--surface-sunken)',
          color: 'var(--text-muted)',
        }}
      >
        <Unplug size={22} />
      </div>
      <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem' }}>We can&apos;t reach Markt right now</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.55 }}>
        This is usually a hiccup on our side. Give it a moment and try again.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--brand)',
          color: 'var(--brand-contrast)',
          border: 0,
          borderRadius: 'var(--radius-full)',
          padding: '0.6rem 1.4rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <RotateCcw size={15} /> Try again
      </button>
    </div>
  );
}
