export type RequestStatus = 'OPEN' | 'FULFILLED' | 'CLOSED' | 'EXPIRED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Seller {
  id: number;
  shop_name: string;
  shop_slug?: string;
  profile_picture_url?: string;
  verification_status?: string;
}

export interface SellerOffer {
  id: number;
  request_id: string;
  seller_id: number;
  seller?: Seller;
  product_id?: string | null;
  price: number;
  message?: string;
  /** Procurement offers: how much of the requested quantity, in its unit. */
  proposed_quantity?: number | null;
  status: OfferStatus;
  created_at: string;
}

/** Markt Business procurement details; optional on every request. */
export interface ProcurementFields {
  quantity?: number | null;
  unit?: string | null;
  specifications?: Record<string, string> | null;
  delivery_location?: string | null;
  required_delivery_date?: string | null;
}

export interface RequestUser {
  id: string;
  username: string;
  profile_picture_url?: string;
}

export interface BuyerRequest extends ProcurementFields {
  id: string;
  /** Posted by a Markt Business account: a procurement request. */
  is_business?: boolean;
  user_id: string;
  user?: RequestUser;
  title: string;
  description: string;
  budget?: number;
  status: RequestStatus;
  views: number;
  upvotes: number;
  offers: SellerOffer[];
  created_at: string;
  expires_at?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface BuyerRequestSearchResult {
  items: BuyerRequest[];
  pagination: Pagination;
}

export function canAcceptOffers(request: BuyerRequest): boolean {
  return request.status === 'OPEN';
}
