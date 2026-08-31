export interface UserSimple {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export interface PostMedia {
  id: number;
  media?: { id: number; original_url?: string; thumbnail_url?: string };
}

export interface PostProduct {
  product_id: string;
}

export interface Post {
  id: string;
  user_id: string;
  user?: UserSimple;
  caption?: string;
  like_count: number;
  comment_count: number;
  social_media?: PostMedia[];
  created_at: string;
}

export interface PostDetail extends Post {
  products?: PostProduct[];
  status?: 'draft' | 'active' | 'archived' | 'deleted';
}

export interface PostComment {
  id: number;
  post_id: string;
  user_id: string;
  user?: UserSimple;
  content: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface PostDetailSearchResult {
  items: PostDetail[];
  pagination: Pagination;
}

/** Lighter list shape (e.g. a user's own published posts). */
export interface PostList {
  items: Post[];
  pagination: Pagination;
}

/** Status actions the post-status endpoint accepts. */
export type PostStatusAction = 'publish' | 'archive' | 'unarchive' | 'delete';

export interface PostComments {
  items: PostComment[];
  pagination: Pagination;
}

export interface Story {
  id: string;
  user_id: string;
  user?: UserSimple;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
}

export function postThumbnail(post: Post): string | undefined {
  const media = post.social_media?.[0]?.media;
  return media?.original_url ?? media?.thumbnail_url;
}
