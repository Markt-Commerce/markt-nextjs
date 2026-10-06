import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getNiche, getNichePosts, canPostInNiche } from '@/lib/api/niches';
import { safeFetch } from '@/lib/api/safe';
import { imageOrFallback } from '@/lib/img';
import { postImages } from '@/lib/types/post';
import { JoinButton } from '../join-button';
import { NicheComposer } from '../niche-composer';
import styles from '../niches.module.css';

export default async function NicheDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession(`/app/community/niches/${id}`);
  const cookie = await getForwardedCookie();

  const niche = await safeFetch(() => getNiche(id, cookie), null);
  if (!niche) {
    return (
      <div className={styles.page}>
        <Link href="/app/community/niches" className={styles.breadcrumb}>
          <ArrowLeft size={15} /> Communities
        </Link>
        <div className={styles.emptyState}>This community couldn&apos;t be loaded right now.</div>
      </div>
    );
  }

  const posts = await safeFetch(() => getNichePosts(id, cookie), {
    items: [],
    pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 },
  });

  // Only members who the backend says can post see the composer.
  const canPost = niche.is_member ? (await safeFetch(() => canPostInNiche(id, cookie), { can_post: false })).can_post : false;

  return (
    <div className={styles.page}>
      <Link href="/app/community/niches" className={styles.breadcrumb}>
        <ArrowLeft size={15} /> Communities
      </Link>

      <div className={styles.detailHero}>
        <div className={styles.detailBanner} style={niche.banner_url ? { backgroundImage: `url(${niche.banner_url})` } : undefined} />
        <div className={styles.detailBody}>
          <span className={styles.detailAvatar}>
            {niche.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={niche.image_url} alt="" className={styles.detailAvatar} style={{ margin: 0, border: 0 }} />
            ) : (
              <Users size={28} />
            )}
          </span>
          <div className={styles.detailInfo}>
            <h1 className={styles.detailName}>{niche.name}</h1>
            <span className={styles.detailMeta}>
              {niche.member_count.toLocaleString('en-NG')} member{niche.member_count === 1 ? '' : 's'} ·{' '}
              {niche.post_count.toLocaleString('en-NG')} post{niche.post_count === 1 ? '' : 's'}
            </span>
            {niche.description && <p className={styles.detailDesc}>{niche.description}</p>}
          </div>
          <JoinButton nicheId={niche.id} initialMember={niche.is_member} />
        </div>
      </div>

      {canPost && <NicheComposer nicheId={id} />}

      <h2 className={styles.sectionTitle}>Posts</h2>
      {posts.items.length === 0 ? (
        <div className={styles.emptyState}>
          {niche.is_member ? 'No posts yet — be the first to share something here.' : 'No posts yet. Join to get involved.'}
        </div>
      ) : (
        posts.items.map((post) => {
          const images = postImages(post);
          return (
            <article key={post.id} className={styles.post}>
              <div className={styles.postHead}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageOrFallback(post.user?.profile_picture_url)} alt="" className={styles.postAvatar} />
                <div>
                  <div className={styles.postAuthor}>{post.user?.username ?? 'User'}</div>
                  <div className={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              {post.caption && <p className={styles.postCaption}>{post.caption}</p>}
              {images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt="" className={styles.postImg} loading="lazy" />
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
