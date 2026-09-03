import { getForwardedCookie } from '@/lib/api/session';
import { listMedia } from '@/lib/api/media';
import { listMyProducts } from '@/lib/api/products';
import { listCategoryTree } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import type { CategoryTreeNode } from '@/lib/types/category';
import { ProductManager, type CategoryOption } from './product-manager';

const EMPTY_LIST = { media: [], page: 1, per_page: 50, total: 0, has_next: false, has_prev: false };

/** Flatten the category tree into a labelled option list (children indented). */
function flattenCategories(nodes: CategoryTreeNode[], depth = 0, out: CategoryOption[] = []): CategoryOption[] {
  for (const node of nodes) {
    out.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}` });
    if (node.children?.length) flattenCategories(node.children, depth + 1, out);
  }
  return out;
}

export default async function ProductManagerPage() {
  const cookie = await getForwardedCookie();
  const [mediaList, products, tree] = await Promise.all([
    safeFetch(() => listMedia(cookie), EMPTY_LIST),
    safeFetch(() => listMyProducts(cookie), []),
    safeFetch(() => listCategoryTree(), []),
  ]);

  return <ProductManager products={products} media={mediaList.media} categories={flattenCategories(tree)} />;
}
