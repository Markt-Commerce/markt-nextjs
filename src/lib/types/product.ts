// Mirrors the real API's Product/ProductSearchResult schemas (snake_case).

export interface SellerSimple {
  id: number;
  shop_name: string;
  shop_slug: string;
  profile_picture_url?: string;
  verification_status?: string;
  average_rating?: number;
  total_products?: number;
}

export interface MediaVariant {
  id: number;
  variant_type: string;
  url?: string;
  width?: number;
  height?: number;
}

export interface Media {
  id: number;
  media_type: 'image' | 'video' | 'document' | 'audio';
  original_url?: string;
  thumbnail_url?: string;
  variants?: MediaVariant[];
  alt_text?: string;
}

export interface ProductImage {
  id: number;
  media_id: number;
  product_id: string;
  is_featured?: boolean;
  sort_order?: number;
  alt_text?: string;
  media?: Media;
}

export interface ProductVariant {
  name: string;
  options: Record<string, unknown>;
}

export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock' | 'deleted';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  sku?: string;
  status?: ProductStatus;
  images: ProductImage[];
  variants?: ProductVariant[];
  seller?: SellerSimple;
  seller_id: number;
  average_rating: number;
  review_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface ProductSearchResult {
  items: Product[];
  pagination: Pagination;
}

export interface ProductReview {
  id: number;
  product_id: string;
  user_id: string;
  user?: { id: string; username: string; profile_picture_url?: string };
  rating: number;
  title?: string;
  content: string;
  upvotes: number;
  is_verified: boolean;
  order_id?: string;
  created_at: string;
}

export interface ProductReviews {
  items: ProductReview[];
  pagination: Pagination;
}

// --- Plain helper functions, no OOP business-rule methods ---

export function primaryImage(product: Product): ProductImage | undefined {
  return product.images?.find((img) => img.is_featured) ?? product.images?.[0];
}

export function primaryImageUrl(product: Product): string | undefined {
  const image = primaryImage(product);
  return image?.media?.original_url ?? image?.media?.thumbnail_url;
}

export function hasDiscount(product: Product): boolean {
  return !!product.compare_at_price && product.compare_at_price > product.price;
}

export function discountPercent(product: Product): number {
  if (!hasDiscount(product) || !product.compare_at_price) return 0;
  return Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100);
}

export function isOutOfStock(product: Product): boolean {
  return product.stock <= 0 || product.status === 'out_of_stock';
}
