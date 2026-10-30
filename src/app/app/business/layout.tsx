import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { getBusinessConfig } from '@/lib/api/business';

/**
 * Everything under /app/business disappears when business mode is switched
 * off in the backend config — the nav entry goes too (see app/layout.tsx).
 */
export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const config = await getBusinessConfig();
  if (!config.features.enabled) notFound();
  return children;
}
