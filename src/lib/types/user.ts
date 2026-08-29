// Shapes mirror the real API's OpenAPI schemas (snake_case, as the backend
// sends them) — see https://test.api.marktcommerce.com/openapi.json.

export type UserRole = 'buyer' | 'seller';

export interface Address {
  house_number?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface BuyerProfile {
  id: number;
  buyername: string;
  is_active: boolean;
  total_orders: number;
  pending_orders: number;
  last_order_date?: string;
  shipping_address?: Record<string, unknown>;
  created_at: string;
}

export interface SellerProfile {
  id: number;
  shop_name: string;
  shop_slug: string;
  description?: string;
  is_active: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';
  average_rating: number;
  total_rating: number;
  total_raters: number;
  total_sales: number;
  total_products: number;
  joined_date: string;
  categories?: unknown;
  policies?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  phone_number?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  current_role: UserRole;
  is_buyer: boolean;
  is_seller: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  address?: Address;
  buyer_account?: BuyerProfile;
  seller_account?: SellerProfile;
}
