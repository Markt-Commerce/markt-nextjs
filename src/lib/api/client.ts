import 'server-only';

const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL is not set — check .env.local');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
    /** Per-field messages parsed from the server's `errors` map, if any. */
    public fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thrown on a 401 for a NON-credential path — the session is gone or expired.
 * Callers (and `safeFetch`) can recognise this to send the user to sign in,
 * rather than treating it as "no data" or a generic server error. A 401 on a
 * credential path (login/register/etc.) is a *bad-credentials* answer, not an
 * expired session, so it stays a plain ApiError.
 */
export class SessionExpiredError extends ApiError {
  constructor(body?: unknown) {
    super(401, 'Your session has expired. Please sign in again.', body);
    this.name = 'SessionExpiredError';
  }
}

// A 401 from any of these means "wrong email/password/code", not "logged out".
// Mirrors the mobile client's credential-path list so both behave identically.
const CREDENTIAL_PATHS = [
  '/users/login',
  '/users/register',
  '/users/auth/oauth',
  '/users/email-verification/verify',
  '/users/password-reset',
  '/users/password-reset/confirm',
  '/deliveries/auth/login',
  '/deliveries/auth/otp',
];

function isCredentialPath(path: string): boolean {
  const clean = path.split('?')[0].replace(/\/+$/, '');
  return CREDENTIAL_PATHS.includes(clean);
}

const DEFAULT_TIMEOUT_MS = 30_000; // normal requests
const UPLOAD_TIMEOUT_MS = 120_000; // multipart uploads are slower

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Raw `Cookie` header to forward — see lib/api/session.ts. */
  cookie?: string;
  body?: unknown;
  /** Override the default 30s request timeout. */
  timeoutMs?: number;
}

/** Toggle a path's trailing slash, preserving any query string. */
function toggleTrailingSlash(path: string): string {
  const [p, q] = path.split('?');
  const query = q ? `?${q}` : '';
  return (p.endsWith('/') ? p.slice(0, -1) : `${p}/`) + query;
}

/**
 * Turn a failed response into a good error message. The backend returns field
 * validation as an `errors` (or `errors.json`) map — surface those as
 * "field: message" and also expose them per-field, so callers branch on the
 * server's actual answer instead of matching on strings.
 */
function parseError(
  status: number,
  statusText: string,
  body: { message?: unknown; detail?: unknown; errors?: unknown } | undefined
): { message: string; fieldErrors?: Record<string, string> } {
  const rawMap = (body?.errors as { json?: unknown })?.json ?? body?.errors;
  if (rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap)) {
    const fieldErrors: Record<string, string> = {};
    const parts: string[] = [];
    for (const [field, val] of Object.entries(rawMap as Record<string, unknown>)) {
      const msg = Array.isArray(val) ? val.join(', ') : String(val);
      fieldErrors[field] = msg;
      parts.push(`${field}: ${msg}`);
    }
    if (parts.length > 0) return { message: parts.join('; '), fieldErrors };
  }
  if (typeof body?.message === 'string' && body.message) return { message: body.message };
  if (typeof body?.detail === 'string' && body.detail) return { message: body.detail };
  return { message: statusText || `Request failed (${status})` };
}

/** Shared !res.ok handling for both JSON and multipart requests. */
async function throwForResponse(res: Response, method: string, path: string): Promise<never> {
  const errorBody = await res.json().catch(() => undefined);
  // Logged here (not left to callers) so every failed call is visible in the
  // terminal running `next dev`, whether or not the caller logs it — Server
  // Actions run server-side, so this is the only console that sees it.
  console.error(`[api] ${method} ${path} -> ${res.status}`, errorBody ?? res.statusText);

  // 401 on a non-credential path = the session is gone. Never on credential
  // paths (that's a bad-login answer the calling screen should show).
  if (res.status === 401 && !isCredentialPath(path)) {
    throw new SessionExpiredError(errorBody);
  }

  const { message, fieldErrors } = parseError(res.status, res.statusText, errorBody);
  throw new ApiError(res.status, message, errorBody, fieldErrors);
}

async function doFetch(path: string, options: ApiFetchOptions): Promise<Response> {
  const { cookie, headers, body, method, timeoutMs, signal, ...rest } = options;

  // Respect a caller-supplied signal; otherwise time the request out so a hung
  // backend eventually fails with a friendly message instead of a forever spinner.
  const requestSignal = signal ?? AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const init: RequestInit = {
    ...rest,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: requestSignal,
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err) {
    // A timed-out request must not be retried — just fail cleanly.
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new ApiError(408, 'That took too long. Please check your connection and try again.');
    }
    // Bare network failure: retry once with the trailing slash toggled — the
    // backend 308-redirects between `/path` and `/path/`, which can surface as
    // a network error server-side. The signal is still live (a network error
    // isn't an abort), so it keeps the same overall timeout budget.
    try {
      res = await fetch(`${API_BASE_URL}${toggleTrailingSlash(path)}`, init);
    } catch {
      throw new ApiError(0, 'Could not reach Markt right now. Please try again in a moment.');
    }
  }

  if (!res.ok) await throwForResponse(res, method ?? 'GET', path);
  return res;
}

/**
 * The only thing in this app that talks to the real backend. Every Server
 * Component, Server Action and Route Handler goes through this — never
 * `fetch()` the API directly elsewhere.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await doFetch(path, options);
  if (res.status === 204 || res.status === 205) return undefined as T;
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
 * Uses a longer (120s) timeout since uploads are slow.
 */
export async function apiFetchMultipart<T>(path: string, formData: FormData, cookie: string | undefined): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: cookie ? { cookie } : undefined,
    body: formData,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  }).catch((err: unknown) => {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new ApiError(408, 'The upload took too long. Try a smaller file or check your connection.');
    }
    throw new ApiError(0, 'Could not reach Markt to upload right now. Please try again.');
  });

  if (!res.ok) await throwForResponse(res, 'POST', path);
  return res.json();
}
