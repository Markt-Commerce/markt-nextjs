'use client';

import { Send } from 'lucide-react';
import { toast } from '@/components/ui/toast';

/** Copies a post's link to the clipboard (web-native "share"), with a toast. */
export function ShareButton({ postId, className }: { postId: string; className: string }) {
  const onClick = async () => {
    const url = `${window.location.origin}/app/community/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'Check this out on Markt' });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard', 'success');
    } catch {
      // User dismissed the share sheet, or clipboard was blocked — ignore.
    }
  };

  return (
    <button type="button" className={className} onClick={onClick} aria-label="Share post">
      <Send size={16} />
    </button>
  );
}
