'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { createBuyerAccount, createSellerAccount } from '@/lib/api/account';
import {
  disableBusiness,
  getMyBusiness,
  removeBusinessImage,
  removeListing,
  requestBusinessVerification,
  saveBusinessProfile,
  saveListing,
  startSubscriptionCheckout,
  uploadBusinessImage,
  type BusinessImageKind,
} from '@/lib/api/business';
import { uploadMedia } from '@/lib/api/media';
import { createProduct } from '@/lib/api/products';
import { createRequest } from '@/lib/api/requests';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { setAppMode, type AppMode } from '@/lib/business-mode';
import type { BusinessListingInput, BusinessProfileInput } from '@/lib/types/business';

export interface BusinessFormState {
  error?: string;
  success?: boolean;
}

/**
 * The backend answers bad input with 422 and per-field messages under
 * errors.json; show those ("website: Not a valid URL.") instead of the bare
 * "Unprocessable Entity".
 */
function errorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const fields = (err.body as { errors?: { json?: Record<string, unknown> } } | undefined)?.errors?.json;
  if (fields && typeof fields === 'object') {
    const parts = Object.entries(fields).map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : typeof msgs === 'object' ? JSON.stringify(msgs) : String(msgs);
      return `${field.replace(/_/g, ' ')}: ${text}`;
    });
    if (parts.length) return parts.join(' · ');
  }
  return `${err.message} (${err.status})`;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

/** Optional text field: empty means "not provided", sent as null. */
function optional(formData: FormData, key: string): string | null {
  return text(formData, key) || null;
}

function optionalNumber(formData: FormData, key: string): number | null | 'invalid' {
  const raw = text(formData, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 'invalid';
}

/** "www.example.com" is what people type; the backend wants a full URL. */
function normaliseUrl(value: string | null): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** Specification rows come in as spec_key[] / spec_value[] pairs. */
function specifications(formData: FormData): Record<string, string> | null {
  const keys = formData.getAll('spec_key').map((k) => String(k).trim());
  const values = formData.getAll('spec_value').map((v) => String(v).trim());
  const specs: Record<string, string> = {};
  keys.forEach((key, i) => {
    if (key && values[i]) specs[key] = values[i];
  });
  return Object.keys(specs).length ? specs : null;
}

// --- Mode ------------------------------------------------------------------

export async function switchModeAction(mode: AppMode): Promise<void> {
  await setAppMode(mode);
  revalidatePath('/app', 'layout');
  redirect(mode === 'business' ? '/app/business' : '/app/dashboard');
}

/**
 * Arriving at a business page by link (from the public site, a
 * notification…) rather than the switch still makes business the remembered
 * mode, so the next page keeps the business nav. No redirect.
 */
export async function rememberModeAction(mode: AppMode): Promise<void> {
  await setAppMode(mode);
}

// --- Business profile ------------------------------------------------------

function profileFromForm(formData: FormData): BusinessProfileInput {
  return {
    name: text(formData, 'name'),
    description: optional(formData, 'description'),
    business_types: formData.getAll('business_types').map(String),
    industry: optional(formData, 'industry'),
    contact_email: optional(formData, 'contact_email'),
    contact_phone: optional(formData, 'contact_phone'),
    website: normaliseUrl(optional(formData, 'website')),
    address: optional(formData, 'address'),
    city: optional(formData, 'city'),
    state: optional(formData, 'state'),
    country: optional(formData, 'country'),
    registration_number: optional(formData, 'registration_number'),
  };
}

/**
 * Onboarding and profile edits share this. On onboarding the form also asks
 * whether the business buys, sells or both, and sets up whichever Markt
 * buyer/seller account is missing — those are what procurement requests and
 * product listings hang off.
 */
export async function saveBusinessProfileAction(_prev: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const user = await requireSession('/app/business/onboarding');
  const cookie = await getForwardedCookie();
  const profile = profileFromForm(formData);
  const onboarding = formData.get('onboarding') === '1';

  if (profile.name.length < 2) return { error: 'Enter your business name.' };
  if (profile.business_types.length === 0) return { error: 'Choose at least one business type.' };

  const wantsToBuy = formData.get('buys') === 'on';
  const wantsToSell = formData.get('sells') === 'on';
  if (onboarding && !wantsToBuy && !wantsToSell && !user.is_buyer && !user.is_seller) {
    return { error: 'Choose whether your business buys, sells, or both.' };
  }

  try {
    await saveBusinessProfile(profile, cookie);
    if (wantsToBuy && !user.is_buyer) await createBuyerAccount(profile.name, cookie);
    if (wantsToSell && !user.is_seller) {
      await createSellerAccount(
        { shop_name: profile.name, description: profile.description || profile.name, category_ids: [] },
        cookie
      );
    }
  } catch (err) {
    return { error: errorMessage(err, 'Could not save your business profile.') };
  }

  revalidatePath('/app', 'layout');
  if (onboarding) {
    await setAppMode('business');
    redirect('/app/business');
  }
  return { success: true };
}

export async function disableBusinessAction(): Promise<void> {
  try {
    await disableBusiness(await getForwardedCookie());
  } catch {
    // The profile page still shows the tag as on; nothing else to surface.
  }
  await setAppMode('consumer');
  revalidatePath('/app', 'layout');
  redirect('/app/dashboard');
}

// --- Listings --------------------------------------------------------------

function listingFromForm(formData: FormData): BusinessListingInput | string {
  const available = optionalNumber(formData, 'available_quantity');
  const minOrder = optionalNumber(formData, 'min_order_quantity');
  if (available === 'invalid' || minOrder === 'invalid') return 'Quantities must be numbers of zero or more.';
  const unit = text(formData, 'unit');
  if (!unit) return 'Choose a unit.';

  return {
    unit,
    available_quantity: available,
    min_order_quantity: minOrder,
    price_negotiable: formData.get('price_negotiable') === 'on',
    production_capacity: optional(formData, 'production_capacity'),
    availability: optional(formData, 'availability'),
    specifications: specifications(formData),
    city: optional(formData, 'city'),
    state: optional(formData, 'state'),
  };
}

export async function saveListingAction(productId: string, _prev: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const listing = listingFromForm(formData);
  if (typeof listing === 'string') return { error: listing };

  try {
    await saveListing(productId, listing, await getForwardedCookie());
  } catch (err) {
    return { error: errorMessage(err, 'Could not save the business terms.') };
  }

  revalidatePath('/app/business/products');
  revalidatePath(`/app/business/products/${productId}`);
  return { success: true };
}

export async function removeListingAction(productId: string): Promise<void> {
  try {
    await removeListing(productId, await getForwardedCookie());
  } catch {
    // Stays listed; the page will still show its terms.
  }
  revalidatePath('/app/business/products');
  redirect('/app/business/products');
}

/** New product with its business terms in one step. */
export async function createBusinessProductAction(_prev: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const name = text(formData, 'name');
  const price = Number(text(formData, 'price'));
  const stockRaw = text(formData, 'stock');
  const stock = stockRaw ? Number(stockRaw) : undefined;

  if (name.length < 2) return { error: 'Enter a product name.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Enter a price per unit above zero.' };
  if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) return { error: 'Stock must be a whole number.' };

  const listing = listingFromForm(formData);
  if (typeof listing === 'string') return { error: listing };

  const cookie = await getForwardedCookie();
  let productId: string;
  try {
    const product = await createProduct(
      { name, description: optional(formData, 'description') ?? undefined, price, stock, status: 'active' },
      cookie
    );
    productId = product.id;
  } catch (err) {
    return { error: errorMessage(err, 'Could not create the product.') };
  }

  try {
    await saveListing(productId, listing, cookie);
  } catch (err) {
    // The product exists; send them to finish its terms rather than
    // creating a duplicate on retry.
    redirect(`/app/business/products/${productId}?error=${encodeURIComponent(errorMessage(err, 'terms'))}`);
  }

  revalidatePath('/app/business/products');
  redirect(`/app/business/products/${productId}?created=1`);
}

// --- Procurement -----------------------------------------------------------

export async function createProcurementAction(_prev: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const title = text(formData, 'title');
  const description = text(formData, 'description');
  const quantity = optionalNumber(formData, 'quantity');
  const budget = optionalNumber(formData, 'budget');
  const neededBy = text(formData, 'required_delivery_date');

  if (!title) return { error: 'Say what you need.' };
  if (description.length < 10) return { error: 'Add a description of at least 10 characters.' };
  if (quantity === 'invalid' || budget === 'invalid') return { error: 'Quantity and budget must be numbers of zero or more.' };

  const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_REQUEST_PHOTOS) return { error: `Attach up to ${MAX_REQUEST_PHOTOS} photos.` };

  const cookie = await getForwardedCookie();
  const mine = await getMyBusiness(cookie).catch(() => null);
  if (!mine?.is_business) return { error: 'Set up your business profile before posting procurement requests.' };

  // Reference photos go through the normal media upload first; the request
  // then links them by id (the backend checks each one is yours).
  const mediaIds: number[] = [];
  for (const photo of photos) {
    try {
      const media = new FormData();
      media.append('file', photo);
      mediaIds.push((await uploadMedia(media, cookie)).id);
    } catch {
      return { error: `Could not upload "${photo.name}". Try a different photo.` };
    }
  }

  let created: { id: string };
  try {
    created = await createRequest(
      {
        title,
        description,
        ...(budget !== null ? { budget } : {}),
        quantity,
        unit: optional(formData, 'unit'),
        specifications: specifications(formData),
        delivery_location: optional(formData, 'delivery_location'),
        required_delivery_date: neededBy || null,
        ...(mediaIds.length ? { media_ids: mediaIds } : {}),
      },
      cookie
    );
  } catch (err) {
    return { error: errorMessage(err, 'Could not post the request.') };
  }

  revalidatePath('/app/business/procurement');
  redirect(`/app/requests/${created.id}`);
}

const MAX_REQUEST_PHOTOS = 5;

// --- Logo and cover ----------------------------------------------------------

export async function uploadBusinessImageAction(kind: BusinessImageKind, _prev: BusinessFormState, formData: FormData): Promise<BusinessFormState> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose an image first.' };
  if (!file.type.startsWith('image/')) return { error: 'That file is not an image.' };

  const upload = new FormData();
  upload.append('file', file);
  try {
    await uploadBusinessImage(kind, upload, await getForwardedCookie());
  } catch (err) {
    return { error: errorMessage(err, 'Could not upload the image.') };
  }
  revalidatePath('/app/business', 'layout');
  return { success: true };
}

export async function removeBusinessImageAction(kind: BusinessImageKind): Promise<void> {
  try {
    await removeBusinessImage(kind, await getForwardedCookie());
  } catch {
    // The image just stays; the card still shows it.
  }
  revalidatePath('/app/business', 'layout');
}

// --- Verification -----------------------------------------------------------

export async function requestVerificationAction(_prev: BusinessFormState): Promise<BusinessFormState> {
  try {
    await requestBusinessVerification(await getForwardedCookie());
  } catch (err) {
    return { error: errorMessage(err, 'Could not send the request.') };
  }
  revalidatePath('/app/business', 'layout');
  return { success: true };
}

// --- Subscription checkout --------------------------------------------------

/**
 * Start paying for a plan. A paid plan sends the browser to Paystack, which
 * comes back to /app/business/subscription via the backend's callback; a free
 * plan is active straight away.
 */
export async function startCheckoutAction(planId: number): Promise<void> {
  let url: string | null;
  try {
    url = (await startSubscriptionCheckout(planId, await getForwardedCookie())).authorization_url;
  } catch {
    redirect('/app/business/subscription?payment=error');
  }
  revalidatePath('/app/business', 'layout');
  redirect(url ?? '/app/business/subscription?payment=success');
}
