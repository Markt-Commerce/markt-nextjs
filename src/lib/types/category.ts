import type { Pagination, Product } from './product';

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: number;
  is_active?: boolean;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug?: string;
  image_url?: string;
  children: CategoryTreeNode[];
}

export interface CategoryProducts {
  category: Category;
  products: Product[];
  pagination: Pagination;
}
