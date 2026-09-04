import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { listMedia } from '@/lib/api/media';
import { listMyProducts } from '@/lib/api/products';
import { listCategoryTree } from '@/lib/api/categories';
import { safeFetch } from '@/lib/api/safe';
import type { CategoryTreeNode } from '@/lib/types/category';
import { ProductManager, type CategoryGroup, type CategoryOption } from './product-manager';

const EMPTY_LIST = { media: [], page: 1, per_page: 50, total: 0, has_next: false, has_prev: false };

/** All descendants of a node, flattened, indented past the first level. */
function flattenDescendants(nodes: CategoryTreeNode[], depth = 0, out: CategoryOption[] = []): CategoryOption[] {
  for (const node of nodes) {
    out.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}` });
    if (node.children?.length) flattenDescendants(node.children, depth + 1, out);
  }
  return out;
}

/** Each top-level category becomes a section (optgroup) with its children under it. */
function groupCategories(tree: CategoryTreeNode[]): CategoryGroup[] {
  return tree.map((node) => ({
    id: node.id,
    name: node.name,
    children: node.children?.length ? flattenDescendants(node.children) : [],
  }));
}

export default async function ProductManagerPage() {
  const user = await requireSession();
  const cookie = await getForwardedCookie();
  const [mediaList, products, tree] = await Promise.all([
    safeFetch(() => listMedia(cookie, user.id), EMPTY_LIST),
    safeFetch(() => listMyProducts(cookie), []),
    safeFetch(() => listCategoryTree(), []),
  ]);

  // Defensive: only ever show the signed-in user's own uploads, even if the
  // backend ignores the user_id filter (the /media/ list isn't reliably scoped).
  const ownMedia = mediaList.media.filter((m) => !m.user_id || m.user_id === user.id);

  return <ProductManager products={products} media={ownMedia} categories={groupCategories(tree)} />;
}
