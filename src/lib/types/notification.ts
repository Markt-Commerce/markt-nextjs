export interface Notification {
  id: number;
  type: string;
  title?: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface NotificationPagination {
  items: Notification[];
  pagination: Pagination;
}

export function notificationActionUrl(notification: Notification): string | null {
  const id = notification.reference_id;
  if (!id) return null;

  switch (notification.reference_type) {
    case 'order':
      return `/app/orders/${id}`;
    case 'product':
      return `/app/marketplace/product/${id}`;
    case 'payment':
      return '/app/payments';
    case 'chat':
    case 'message':
      return `/app/chat/${id}`;
    case 'request':
      return `/app/requests/${id}`;
    case 'offer':
      return `/app/offers/${id}`;
    default:
      return null;
  }
}
