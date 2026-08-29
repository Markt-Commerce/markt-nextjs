'use server';

import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { createRequest } from '@/lib/api/requests';
import { getForwardedCookie } from '@/lib/api/session';

export interface CreateRequestState {
  error?: string;
}

export async function createRequestAction(_prev: CreateRequestState, formData: FormData): Promise<CreateRequestState> {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const budget = String(formData.get('budget') ?? '').trim();
  const expiresAt = String(formData.get('expires_at') ?? '').trim();

  if (!title || !description) return { error: 'Please fill in the required fields.' };

  let created: { id: string };
  try {
    created = await createRequest(
      {
        title,
        description,
        ...(budget ? { budget: Number(budget) } : {}),
        ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
      },
      await getForwardedCookie()
    );
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not post request.' };
  }

  redirect(`/app/requests/${created.id}`);
}
