import Link from 'next/link';
import { MessageCircle, Radio, UserPlus } from 'lucide-react';
import { getForwardedCookie, getSession } from '@/lib/api/session';
import { getLatestPosts, getFollowingFeed, getStories } from '@/lib/api/social';
import { listMyProducts } from '@/lib/api/products';
import { listPeopleToFollow } from '@/lib/api/users';
import { safeFetch } from '@/lib/api/safe';
import { postThumbnail } from '@/lib/types/post';
import { primaryImageUrl } from '@/lib/types/product';
import { imageOrFallback } from '@/lib/img';
import { Composer, type TaggableProduct } from '../composer';
import { LikeButton } from '../like-button';
import { FollowButton } from '../follow-button';
import styles from './page.module.css';

const EMPTY_FEED = { items: [], pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 } };
type Tab = 'latest' | 'following';

export default async function SocialFeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === 'following' ? 'following' : 'latest';

  const cookie = await getForwardedCookie();
  const user = await getSession();

  const [feed, stories, people, myProducts] = await Promise.all([
    safeFetch(() => (tab === 'following' ? getFollowingFeed(cookie) : getLatestPosts(cookie)), EMPTY_FEED),
    safeFetch(() => getStories(cookie), []),
    safeFetch(() => listPeopleToFollow(cookie), []),
    // Sellers can tag one of their own products in a post. Buyers get an
    // empty list, so the "Tag product" button simply doesn't appear.
    user?.current_role === 'seller' ? safeFetch(() => listMyProducts(cookie), []) : Promise.resolve([]),
  ]);

  const taggable: TaggableProduct[] = myProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: primaryImageUrl(p),
  }));

  // Don't suggest the current user to themselves; keep the rail short.
  const suggestions = people.filter((p) => p.id !== user?.id).slice(0, 8);

  return (
    <div className={styles.page}>
      <div className={styles.feedCol}>
        <h1 className={styles.title}>Community</h1>
        <p className={styles.subtitle}>What people around you are finding, making, and selling.</p>

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

        {/* Feed source tabs. */}
        <div className={styles.tabs}>
          <Link href="/app/community/social-feed" className={tab === 'latest' ? styles.tabActive : styles.tab}>
            Latest
          </Link>
          <Link href="/app/community/social-feed?tab=following" className={tab === 'following' ? styles.tabActive : styles.tab}>
            Following
          </Link>
        </div>

        <Composer products={taggable} />

        <div className={styles.feed}>
          {feed.items.map((post) => {
          const image = postThumbnail(post);
          const taggedProductId = post.products?.[0]?.product_id;
          return (
            <article key={post.id} className={styles.postCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageOrFallback(post.user?.profile_picture_url)} alt="" className={styles.avatar} />

              <div className={styles.postMain}>
                <div className={styles.postTopRow}>
                  <span className={styles.authorName}>{post.user?.username ?? 'User'}</span>
                  <span className={styles.postDot}>·</span>
                  <span className={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>

                {post.caption && <p className={styles.caption}>{post.caption}</p>}

                {image && (
                  <div className={styles.postImageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className={styles.postImage} loading="lazy" />
                  </div>
                )}

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

          {feed.items.length === 0 && (
            <div className={styles.emptyState}>
              {tab === 'following'
                ? 'Posts from people you follow will show up here. Follow a few people to get started.'
                : 'Nothing in the feed yet. Be the first to post something.'}
            </div>
          )}
        </div>
      </div>

      {/* X-style right rail: people to follow, alongside the feed. */}
      <aside className={styles.side}>
        {suggestions.length > 0 && (
          <section className={styles.sideCard}>
            <div className={styles.discoverHead}>
              <span className={styles.discoverTitle}>
                <UserPlus size={15} /> People to follow
              </span>
            </div>
            <div className={styles.peopleList}>
              {suggestions.map((person) => (
                <div key={person.id} className={styles.personRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOrFallback(person.profile_picture_url)} alt="" className={styles.personAvatar} />
                  <div className={styles.personMeta}>
                    <span className={styles.personName}>{person.username}</span>
                    <span className={styles.personHandle}>{person.is_seller ? 'Seller' : 'Buyer'}</span>
                  </div>
                  <FollowButton userId={person.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.sideCard}>
          <span className={styles.livePill}>
            <Radio size={13} /> Live shopping · coming soon
          </span>
        </section>
      </aside>
    </div>
  );
}
