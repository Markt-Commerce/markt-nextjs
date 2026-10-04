'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { getForwardedCookie } from '@/lib/api/session';
import { createSellerAccount } from '@/lib/api/account';
import { uploadMedia } from '@/lib/api/media';

export interface ApplicationState {
  error?: string;
  success?: boolean;
}

// The documents an applicant must provide to be reviewed.
const DOC_FIELDS = [
  { key: 'doc_id', label: 'a government-issued ID' },
  { key: 'doc_proof', label: 'proof of address or business registration' },
  { key: 'doc_shop', label: 'a shop or product photo' },
] as const;

async function uploadDoc(file: File, cookie: string | undefined): Promise<number> {
  const fd = new FormData();
  fd.append('file', file);
  const media = await uploadMedia(fd, cookie);
  return media.id;
}

/**
 * Submit a seller application. Until the backend ships a real review endpoint
 * (see docs/backend/backend-action-items.md §9), this is a documented interim:
 * the documents are uploaded for real, and the shop is created via
 * `create-seller` with the document references + a "submitted" marker stashed in
 * the freeform `policies` blob, so nothing the applicant provided is lost.
 */
export async function submitSellerApplicationAction(_prev: ApplicationState, formData: FormData): Promise<ApplicationState> {
  const shopName = String(formData.get('shop_name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const agreed = formData.get('agree') === 'on';
  const categoryIds = formData
    .getAll('category_ids')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!shopName || !description) return { error: 'Your shop needs a name and a short description.' };
  if (categoryIds.length === 0) return { error: 'Pick at least one category so buyers can find your shop.' };
  if (!agreed) return { error: 'Please confirm the information is accurate and accept the seller terms.' };

  // Every document is required.
  const files: { key: string; file: File }[] = [];
  for (const { key, label } of DOC_FIELDS) {
    const f = formData.get(key);
    if (!(f instanceof File) || f.size === 0) return { error: `Please upload ${label}.` };
    files.push({ key, file: f });
  }

  const cookie = await getForwardedCookie();

  // Upload the documents first so we can reference them in the application.
  const documents: { type: string; media_id: number }[] = [];
  try {
    for (const { key, file } of files) {
      documents.push({ type: key, media_id: await uploadDoc(file, cookie) });
    }
  } catch (err) {
    return {
      error: err instanceof ApiError ? `Couldn’t upload your documents (${err.status}). Try smaller files.` : 'Couldn’t upload your documents. Please try again.',
    };
  }

  try {
    await createSellerAccount(
      {
        shop_name: shopName,
        description,
        category_ids: categoryIds,
        policies: {
          application: {
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            documents,
          },
        },
      },
      cookie
    );
  } catch (err) {
    return {
      error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not submit your application. Please try again.',
    };
  }

  revalidatePath('/app/become-seller');
  revalidatePath('/app', 'layout');
  return { success: true };
}
