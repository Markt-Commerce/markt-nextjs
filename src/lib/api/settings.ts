import 'server-only';
import { apiFetch } from './client';

// The real API's Settings/SettingsUpdate schemas are both fully open
// ({} in the OpenAPI spec) — this is a freeform JSON blob the backend
// stores as-is, not a fixed shape.
export async function getUserSettings(cookie: string | undefined): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/users/settings', { cookie, cache: 'no-store' });
}

export async function updateUserSettings(
  patch: Record<string, unknown>,
  cookie: string | undefined
): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>('/users/settings', { method: 'PATCH', cookie, body: patch });
}
