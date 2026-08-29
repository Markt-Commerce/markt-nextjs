import { getForwardedCookie } from '@/lib/api/session';
import { getMediaStats, listMedia } from '@/lib/api/media';
import { safeFetch } from '@/lib/api/safe';
import { MediaLibrary } from './media-library';

const EMPTY_LIST = { media: [], page: 1, per_page: 50, total: 0, has_next: false, has_prev: false };

export default async function MediaLibraryPage() {
  const cookie = await getForwardedCookie();
  const [mediaList, stats] = await Promise.all([safeFetch(() => listMedia(cookie), EMPTY_LIST), safeFetch(() => getMediaStats(cookie), null)]);

  return <MediaLibrary initialMedia={mediaList.media} stats={stats} />;
}
