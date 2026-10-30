import 'server-only';
import { cookies } from 'next/headers';

/**
 * Which experience the signed-in user last chose: everyday Markt or Markt
 * Business. A preference, not a permission — it only decides which nav the
 * app shows. Whether business features work at all is the backend's call
 * (see getBusinessConfig and MyBusiness.is_business).
 */
export type AppMode = 'consumer' | 'business';

export const MODE_COOKIE = 'markt_mode';

export async function getAppMode(): Promise<AppMode> {
  return (await cookies()).get(MODE_COOKIE)?.value === 'business' ? 'business' : 'consumer';
}

export async function setAppMode(mode: AppMode): Promise<void> {
  (await cookies()).set(MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
