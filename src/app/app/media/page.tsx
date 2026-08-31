import { getForwardedCookie } from '@/lib/api/session';
import { getMediaStats, listMedia } from '@/lib/api/media';
import { listMyProducts } from '@/lib/api/products';
import { safeFetch } from '@/lib/api/safe';
import { MediaLibrary, type ProductOption, type MediaAttachment } from './media-library';

const EMPTY_LIST = { media: [], page: 1, per_page: 50, total: 0, has_next: false, has_prev: false };

export default async function MediaLibraryPage() {
  const cookie = await getForwardedCookie();
  const [mediaList, stats, products] = await Promise.all([
    safeFetch(() => listMedia(cookie), EMPTY_LIST),
    safeFetch(() => getMediaStats(cookie), null),
    safeFetch(() => listMyProducts(cookie), []),
  ]);

  // Each product already carries its images (media_id + image id), so the
  // media -> product map is built here with no extra API round-trips. This is
  // what connects the library to the seller's inventory: every uploaded image
  // shows which product(s) it's used on, and can be attached/detached.
  const attachments: Record<number, MediaAttachment[]> = {};
  for (const product of products) {
    for (const img of product.images ?? []) {
      (attachments[img.media_id] ??= []).push({ productId: product.id, productName: product.name, imageId: img.id });
    }
  }

  const productOptions: ProductOption[] = products.map((p) => ({ id: p.id, name: p.name }));

  return <MediaLibrary initialMedia={mediaList.media} stats={stats} products={productOptions} attachments={attachments} />;
}
