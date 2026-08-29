'use server';

import { revalidatePath } from 'next/cache';
import { markMessagesRead, sendMessage } from '@/lib/api/chat';
import { getForwardedCookie } from '@/lib/api/session';

export async function sendMessageAction(roomId: number, content: string): Promise<{ error?: string }> {
  const trimmed = content.trim();
  if (!trimmed) return { error: 'Message is empty.' };

  try {
    await sendMessage(roomId, trimmed, await getForwardedCookie());
  } catch {
    return { error: 'Could not send. Try again.' };
  }

  revalidatePath('/app/chat');
  return {};
}

export async function markReadAction(roomId: number): Promise<void> {
  try {
    await markMessagesRead(roomId, await getForwardedCookie());
  } catch {
    // Best-effort.
  }
  revalidatePath('/app/chat');
  revalidatePath('/app', 'layout');
}
