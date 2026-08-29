import 'server-only';

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not set — check .env.local');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Raw `Cookie` header to forward — see lib/api/session.ts. */
  cookie?: string;
  body?: unknown;
}

async function doFetch(path: string, options: ApiFetchOptions): Promise<Response> {
  const { cookie, headers, body, method, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => undefined);
    // Logged here (not left to callers) so every failed call is visible in
    // the terminal running `next dev`, whether or not the caller bothers to
    // log it — Server Actions run server-side, so this is the only console
    // that will ever see it.
    console.error(`[api] ${method ?? 'GET'} ${path} -> ${res.status}`, errorBody ?? res.statusText);
    throw new ApiError(res.status, errorBody?.message ?? res.statusText, errorBody);
  }

  return res;
}

/**
 * The only thing in this app that talks to the real backend. Every Server
 * Component, Server Action and Route Handler goes through this — never
 * `fetch()` the API directly elsewhere.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await doFetch(path, options);
  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Same as apiFetch, but hands back the raw Response so callers that need
 * Set-Cookie headers (login, register, logout) can relay them — see
 * lib/api/session.ts `relaySetCookies`.
 */
export async function apiFetchRaw(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  return doFetch(path, options);
}

/**
 * File uploads (media) — a separate path from apiFetch because the body is
 * a FormData/Blob, not JSON, and must not be Content-Type'd or stringified.
 */
export async function apiFetchMultipart<T>(path: string, formData: FormData, cookie: string | undefined): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: cookie ? { cookie } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => undefined);
    console.error(`[api] POST ${path} -> ${res.status}`, errorBody ?? res.statusText);
    throw new ApiError(res.status, errorBody?.message ?? res.statusText, errorBody);
  }

  return res.json();
}
