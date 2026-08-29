import { NextResponse } from 'next/server';
import { listMessages } from '@/lib/api/chat';
import { getForwardedCookie } from '@/lib/api/session';

// The one client-reachable proxy in the app — chat needs to poll, and
// polling belongs client-side (TanStack Query), but the browser never talks
// to the real API directly (see lib/api/session.ts). This just forwards.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isFinite(roomId)) return NextResponse.json({ messages: [] }, { status: 400 });

  try {
    const data = await listMessages(roomId, await getForwardedCookie());
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
