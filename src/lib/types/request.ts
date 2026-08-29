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
  status: OfferStatus;
  created_at: string;
}

export interface BuyerRequest {
  id: string;
  user_id: string;
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
