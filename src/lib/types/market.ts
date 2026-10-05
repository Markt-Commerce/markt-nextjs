export interface Market {
  id: number;
  name: string;
  slug?: string;
  seller_count: number;
  is_active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MarketList {
  markets: Market[];
}
