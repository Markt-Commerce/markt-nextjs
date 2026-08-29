import 'server-only';
import { apiFetch } from './client';
import type { ChatMessageList, ChatRoomList } from '@/lib/types/chat';

export async function listChatRooms(cookie: string | undefined): Promise<ChatRoomList> {
  return apiFetch<ChatRoomList>('/chats/rooms', { cookie, cache: 'no-store' });
}

export async function getOrCreateRoom(
  args: { buyerId: string; sellerId: string; productId?: string; requestId?: string },
  cookie: string | undefined
): Promise<{ id: number }> {
  return apiFetch<{ id: number }>('/chats/rooms', {
    method: 'POST',
    cookie,
    body: { buyer_id: args.buyerId, seller_id: args.sellerId, product_id: args.productId, request_id: args.requestId },
  });
}

export async function listMessages(roomId: number, cookie: string | undefined): Promise<ChatMessageList> {
  return apiFetch<ChatMessageList>(`/chats/rooms/${roomId}/messages?per_page=100`, { cookie, cache: 'no-store' });
}

export async function sendMessage(roomId: number, content: string, cookie: string | undefined): Promise<void> {
  await apiFetch(`/chats/rooms/${roomId}/messages`, { method: 'POST', cookie, body: { content } });
}

export async function markMessagesRead(roomId: number, cookie: string | undefined): Promise<void> {
  await apiFetch(`/chats/rooms/${roomId}/read`, { method: 'POST', cookie });
}
