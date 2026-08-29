import Link from 'next/link';
import { Users, MessageCircle } from 'lucide-react';
import { getForwardedCookie } from '@/lib/api/session';
import { getFeed, getStories } from '@/lib/api/social';
import { safeFetch } from '@/lib/api/safe';
import { postThumbnail } from '@/lib/types/post';
import { Composer } from '../composer';
import { LikeButton } from '../like-button';
import styles from './page.module.css';

export default async function SocialFeedPage() {
  const cookie = await getForwardedCookie();
  const [feed, stories] = await Promise.all([
    safeFetch(() => getFeed(cookie), { items: [], pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 } }),
    safeFetch(() => getStories(cookie), []),
  ]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        <Users size={22} /> Community
      </h1>

      {stories.length > 0 && (
        <div className={styles.stories}>
          {stories.map((story) => (
            <button key={story.id} type="button" className={styles.storyItem}>
              <div className={styles.storyRing}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.media_url} alt="" className={styles.storyAvatar} />
              </div>
              <span className={styles.storyName}>{story.user?.username ?? 'User'}</span>
            </button>
          ))}
        </div>
      )}

      <Composer />

      <div className={styles.feed}>
        {feed.items.map((post) => {
          const image = postThumbnail(post);
          const taggedProductId = post.products?.[0]?.product_id;
          return (
            <article key={post.id} className={styles.postCard}>
              <div className={styles.postHead}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.user?.profile_picture_url ?? '/Logo.png'} alt="" className={styles.avatar} />
                <div>
                  <p className={styles.authorName}>{post.user?.username ?? 'User'}</p>
                  <p className={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className={styles.postImage} />
              )}

              <div className={styles.postBody}>
                {post.caption && <p className={styles.caption}>{post.caption}</p>}
                {taggedProductId && (
                  <Link href={`/app/marketplace/product/${taggedProductId}`} className={styles.productTag}>
                    View tagged product
                  </Link>
                )}

                <div className={styles.actionsRow}>
                  <LikeButton postId={post.id} initialCount={post.like_count} className={styles.actionBtn} activeClassName={styles.actionBtnLiked} />
                  <Link href={`/app/community/post/${post.id}`} className={styles.actionLink}>
                    <MessageCircle size={16} /> {post.comment_count}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
