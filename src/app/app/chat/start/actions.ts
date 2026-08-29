'use server';

import { redirect } from 'next/navigation';
import { getOrCreateRoom } from '@/lib/api/chat';
import { getForwardedCookie, requireSession } from '@/lib/api/session';

export async function startChatAction(sellerId: string, productId?: string): Promise<void> {
  const user = await requireSession();

  let room: { id: number };
  try {
    room = await getOrCreateRoom({ buyerId: user.id, sellerId, productId }, await getForwardedCookie());
  } catch {
    // No inline error surface on this page (plain form, no useActionState) —
    // the button just stays clickable and nothing happens. Acceptable for
    // this lower-traffic page; revisit if it turns out to confuse people.
    redirect('/app/chat/start?error=1');
  }

  redirect(`/app/chat/${room.id}`);
}
