export interface StartCardCTA {
  href: string;
  label: string;
}

export interface StartCard {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  cta: StartCardCTA;
}

export interface StartCardsResponse {
  items: StartCard[];
}

export interface AnalyticsOverview {
  revenue_30d: number;
  orders_30d: number;
  views_30d: number;
  conversion_30d: number;
}
