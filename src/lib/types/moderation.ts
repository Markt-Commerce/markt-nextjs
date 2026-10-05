export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'nudity',
  'scam_or_fraud',
  'counterfeit',
  'illegal_item',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportContentType = 'post' | 'product' | 'comment' | 'chat_message' | 'user';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  hate_speech: 'Hate speech',
  violence: 'Violence or threats',
  nudity: 'Nudity or sexual content',
  scam_or_fraud: 'Scam or fraud',
  counterfeit: 'Counterfeit goods',
  illegal_item: 'Illegal item',
  other: 'Something else',
};

export interface BlockedUser {
  user_id: string;
  username: string;
  profile_picture?: string | null;
  blocked_at?: string | null;
}
