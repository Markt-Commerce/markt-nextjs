import Link from 'next/link';
import { MessageCircle, Store, UserPlus, ChevronRight, BadgeCheck, Tag, Users } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { getForwardedCookie, getSession } from '@/lib/api/session';
import { getLatestPosts, getFollowingFeed, getStories } from '@/lib/api/social';
import { getProduct, listMyProducts } from '@/lib/api/products';
import { listPeopleToFollow } from '@/lib/api/users';
import { listTrendingShops } from '@/lib/api/shops';
import { listSavedPostIds } from '@/lib/api/saved';
import { safeFetch } from '@/lib/api/safe';
import { postImages } from '@/lib/types/post';
import { primaryImageUrl, type Product } from '@/lib/types/product';
import { imageOrFallback } from '@/lib/img';
import { cn } from '@/lib/cn';
import { Composer, type TaggableProduct } from '../composer';
import { LikeButton } from '../like-button';
import { SaveButton } from '../save-button';
import { ShareButton } from '../share-button';
import { FollowButton } from '../follow-button';
import styles from './page.module.css';

const EMPTY_FEED = { items: [], pagination: { page: 1, per_page: 20, total_items: 0, total_pages: 0 } };
type Tab = 'latest' | 'following';

export default async function SocialFeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === 'following' ? 'following' : 'latest';

  const cookie = await getForwardedCookie();
  const user = await getSession();

  const [feed, stories, people, trendingShops, savedPostIds, myProducts] = await Promise.all([
    safeFetch(() => (tab === 'following' ? getFollowingFeed(cookie) : getLatestPosts(cookie)), EMPTY_FEED),
    safeFetch(() => getStories(cookie), []),
    safeFetch(() => listPeopleToFollow(cookie), []),
    safeFetch(() => listTrendingShops(cookie), []),
    listSavedPostIds(cookie),
    user?.current_role === 'seller' ? safeFetch(() => listMyProducts(cookie), []) : Promise.resolve([]),
  ]);

  // Resolve tagged products so a product post renders a real card (the feed
  // payload only carries product_id). Bounded to the handful of tagged posts.
  const taggedIds = Array.from(new Set(feed.items.flatMap((p) => (p.products ?? []).map((x) => x.product_id))));
  const taggedProducts = new Map<string, Product>();
  await Promise.all(
    taggedIds.map(async (id) => {
      const product = await safeFetch(() => getProduct(id, cookie), null);
      if (product) taggedProducts.set(id, product);
    })
  );

  const taggable: TaggableProduct[] = myProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: primaryImageUrl(p),
  }));

  const savedSet = new Set(savedPostIds);
  const suggestions = people.filter((p) => p.id !== user?.id).slice(0, 5);
  const shops = trendingShops.filter((s) => s.shop_name).slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.feedCol}>
        {/* Sticky feed header with X-style tabs. */}
        <div className={styles.feedHeader}>
          <Link href="/app/community/social-feed" className={tab === 'latest' ? styles.tabActive : styles.tab}>
            For you
          </Link>
          <Link
            href="/app/community/social-feed?tab=following"
            className={tab === 'following' ? styles.tabActive : styles.tab}
          >
            Following
          </Link>
        </div>

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

        <Composer products={taggable} isSeller={user?.current_role === 'seller'} />

        <div className={styles.feed}>
          {feed.items.map((post) => {
            const images = postImages(post);
            const taggedId = post.products?.[0]?.product_id;
            const product = taggedId ? taggedProducts.get(taggedId) : undefined;
            const isSeller = post.user?.id ? people.find((p) => p.id === post.user?.id)?.is_seller : undefined;
            const gridClass =
              images.length === 1 ? styles.grid1 : images.length === 2 ? styles.grid2 : images.length === 3 ? styles.grid3 : styles.grid4;

            return (
              <article key={post.id} className={styles.postCard}>
                <Link href={`/app/community/post/${post.id}`} className={styles.avatarLink} aria-label={`${post.user?.username ?? 'User'}'s post`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOrFallback(post.user?.profile_picture_url)} alt="" className={styles.avatar} />
                </Link>

                <div className={styles.postMain}>
                  <div className={styles.postTopRow}>
                    <span className={styles.authorName}>{post.user?.username ?? 'User'}</span>
                    {isSeller && <BadgeCheck size={14} className={styles.verified} aria-label="Seller" />}
                    <span className={styles.postHandle}>@{post.user?.username ?? 'user'}</span>
                    <span className={styles.postDot}>·</span>
                    <span className={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>

                  {post.caption && <p className={styles.caption}>{post.caption}</p>}

                  {images.length > 0 && (
                    <div className={cn(styles.mediaGrid, gridClass)}>
                      {images.slice(0, 4).map((src, i) => (
                        <div key={i} className={styles.mediaCell}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className={styles.mediaImg} loading="lazy" />
                          {i === 3 && images.length > 4 && <span className={styles.mediaMore}>+{images.length - 4}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {product ? (
                    <Link href={`/app/marketplace/product/${product.id}`} className={styles.productCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={primaryImageUrl(product) ?? '/assets/images/products/sony-headphones.png'}
                        alt={product.name}
                        className={styles.productThumb}
                      />
                      <div className={styles.productInfo}>
                        <span className={styles.productName}>{product.name}</span>
                        <span className={styles.productPrice}>{formatNaira(product.price)}</span>
                      </div>
                      <ChevronRight size={16} className={styles.productChevron} />
                    </Link>
                  ) : (
                    // The post tagged a product but we couldn't resolve its full
                    // details — still surface the tag rather than hiding it.
                    taggedId && (
                      <Link href={`/app/marketplace/product/${taggedId}`} className={styles.productCard}>
                        <span className={styles.productThumbFallback}>
                          <Tag size={18} />
                        </span>
                        <div className={styles.productInfo}>
                          <span className={styles.productName}>Tagged product</span>
                          <span className={styles.productPrice}>View in marketplace</span>
                        </div>
                        <ChevronRight size={16} className={styles.productChevron} />
                      </Link>
                    )
                  )}

                  <div className={styles.actionsRow}>
                    <LikeButton
                      postId={post.id}
                      initialCount={post.like_count}
                      initialLiked={post.liked_by_me ?? false}
                      className={styles.actionBtn}
                      activeClassName={styles.actionBtnLiked}
                    />
                    <Link href={`/app/community/post/${post.id}`} className={styles.actionBtn}>
                      <MessageCircle size={16} /> {post.comment_count}
                    </Link>
                    <SaveButton
                      postId={post.id}
                      initialSaved={post.is_saved ?? savedSet.has(post.id)}
                      className={styles.actionBtn}
                      activeClassName={styles.actionBtnSaved}
                    />
                    <ShareButton postId={post.id} className={cn(styles.actionBtn, styles.actionShare)} />
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

      {/* X/Reddit-style right rail. */}
      <aside className={styles.side}>
        {suggestions.length > 0 && (
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>
              <UserPlus size={15} /> Who to follow
            </h2>
            <div className={styles.sideList}>
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

        {shops.length > 0 && (
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>
              <Store size={15} /> Trending shops
            </h2>
            <div className={styles.sideList}>
              {shops.map((shop) => (
                <Link key={shop.id ?? shop.shop_name} href="/app/marketplace" className={styles.shopRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageOrFallback(shop.profile_picture_url)} alt="" className={styles.personAvatar} />
                  <div className={styles.personMeta}>
                    <span className={styles.personName}>{shop.shop_name}</span>
                    {shop.description && <span className={styles.personHandle}>{shop.description}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.sideCard}>
          <h2 className={styles.sideTitle}>
            <Users size={15} /> Communities
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.6rem', lineHeight: 1.45 }}>
            Niches for the things you buy, sell, and love.
          </p>
          <Link
            href="/app/community/niches"
            style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--brand-text)', textDecoration: 'none' }}
          >
            Discover communities →
          </Link>
        </section>

        <nav className={styles.footer}>
          <Link href="/app/marketplace">Marketplace</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/app/support">Help</Link>
          <span className={styles.footerNote}>© {new Date().getFullYear()} Markt</span>
        </nav>
      </aside>
    </div>
  );
}
