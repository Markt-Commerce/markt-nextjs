'use server';

import { revalidatePath } from 'next/cache';
import { ApiError } from '@/lib/api/client';
import { cancelOrder, updateSellerOrderItem } from '@/lib/api/orders';
import { getForwardedCookie } from '@/lib/api/session';

export async function cancelOrderAction(orderId: string): Promise<{ error?: string }> {
  try {
    await cancelOrder(orderId, undefined, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not cancel order.' };
  }

  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath('/app/orders');
  return {};
}

/** Seller advances one of their order items along the fulfilment ladder. */
export async function advanceOrderItemAction(
  itemId: number,
  status: string,
  orderId: string
): Promise<{ error?: string }> {
  try {
    await updateSellerOrderItem(itemId, status, await getForwardedCookie());
  } catch (err) {
    return { error: err instanceof ApiError ? `${err.message} (${err.status})` : 'Could not update the order item.' };
  }
  revalidatePath(`/app/orders/${orderId}`);
  revalidatePath('/app/orders');
  return {};
}
