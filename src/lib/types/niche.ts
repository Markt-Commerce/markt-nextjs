import type { Pagination, PostDetail } from './post';

export interface Niche {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  banner_url?: string;
  member_count: number;
  post_count: number;
  is_member: boolean;
  visibility?: string;
  status?: string;
  allow_buyer_posts?: boolean;
  allow_seller_posts?: boolean;
  require_approval?: boolean;
  tags?: string[];
  categories?: unknown;
  created_at?: string;
}

export interface NicheList {
  items: Niche[];
  pagination: Pagination;
}

export interface NicheMembership {
  id: string;
  niche_id: string;
  niche?: Niche;
  role?: string;
  joined_at?: string;
  is_active?: boolean;
  is_banned?: boolean;
}

export interface NicheMembershipList {
  items: NicheMembership[];
  pagination: Pagination;
}

export interface NichePostList {
  items: PostDetail[];
  pagination: Pagination;
}

export interface CanPost {
  can_post: boolean;
  reason?: string;
}
