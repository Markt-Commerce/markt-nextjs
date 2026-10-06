import Link from 'next/link';
import { MessageCircle, ChevronRight, Tag } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { cn } from '@/lib/cn';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getPost, getPostComments } from '@/lib/api/social';
import { getProduct } from '@/lib/api/products';
import { getPublicProfile } from '@/lib/api/account';
import { safeFetch } from '@/lib/api/safe';
import { postImages } from '@/lib/types/post';
import { primaryImageUrl } from '@/lib/types/product';
import { imageOrFallback } from '@/lib/img';
import { LikeButton } from '../../like-button';
import { SaveButton } from '../../save-button';
import { ShareButton } from '../../share-button';
import { FollowButton } from '../../follow-button';
import { PostMenu } from '@/components/moderation/PostMenu';
import { CommentForm } from './comment-form';
import styles from './page.module.css';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = await getForwardedCookie();
  const user = await requireSession();

  let post;
  try {
    post = await getPost(id, cookie);
  } catch {
    return (
      <div className={styles.page}>
        <p>This post couldn&apos;t be loaded right now.</p>
      </div>
    );
  }

  const comments = await safeFetch(() => getPostComments(id, cookie), {
    items: [],
    pagination: { page: 1, per_page: 50, total_items: 0, total_pages: 0 },
  });

  const images = postImages(post);
  const taggedProductId = post.products?.[0]?.product_id;
  const isOwnPost = post.user_id === user.id;

  // Seed the follow button with the real state so it doesn't reset to "Follow"
  // after a refresh once you've already followed the author.
  const authorProfile = isOwnPost ? null : await safeFetch(() => getPublicProfile(post.user_id, cookie), null);
  const taggedProduct = taggedProductId ? await safeFetch(() => getProduct(taggedProductId, cookie), null) : null;
  const gridClass =
    images.length === 1 ? styles.grid1 : images.length === 2 ? styles.grid2 : images.length === 3 ? styles.grid3 : styles.grid4;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/community/social-feed">Community</Link> / Post
      </nav>

      <article className={styles.postCard}>
        <div className={styles.postHead}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageOrFallback(post.user?.profile_picture_url)} alt="" className={styles.avatar} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className={styles.authorName}>{post.user?.username ?? 'User'}</p>
            <p className={styles.postTime}>{new Date(post.created_at).toLocaleString()}</p>
          </div>
          {!isOwnPost && <FollowButton userId={post.user_id} initialFollowing={authorProfile?.is_followed ?? false} />}
          {!isOwnPost && <PostMenu postId={post.id} authorId={post.user_id} authorName={post.user?.username} />}
        </div>

        <div className={styles.postBody}>
          {post.caption && <p className={styles.caption}>{post.caption}</p>}

          {images.length > 0 && (
            <div className={cn(styles.mediaGrid, gridClass)}>
              {images.slice(0, 4).map((src, i) => (
                <div key={i} className={styles.mediaCell}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className={styles.mediaImg} />
                  {i === 3 && images.length > 4 && <span className={styles.mediaMore}>+{images.length - 4}</span>}
                </div>
              ))}
            </div>
          )}

          {taggedProduct ? (
            <Link href={`/app/marketplace/product/${taggedProduct.id}`} className={styles.productCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImageUrl(taggedProduct) ?? '/assets/images/products/sony-headphones.png'}
                alt={taggedProduct.name}
                className={styles.productThumb}
              />
              <div className={styles.productInfo}>
                <span className={styles.productName}>{taggedProduct.name}</span>
                <span className={styles.productPrice}>{formatNaira(taggedProduct.price)}</span>
              </div>
              <ChevronRight size={16} className={styles.productChevron} />
            </Link>
          ) : (
            taggedProductId && (
              <Link href={`/app/marketplace/product/${taggedProductId}`} className={styles.productCard}>
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
            <span className={styles.actionBtn}>
              <MessageCircle size={16} /> {post.comment_count}
            </span>
            <SaveButton
              postId={post.id}
              initialSaved={post.is_saved ?? false}
              className={styles.actionBtn}
              activeClassName={styles.actionBtnSaved}
            />
            <ShareButton postId={post.id} className={cn(styles.actionBtn, styles.actionShare)} />
          </div>
        </div>
      </article>

      <h2 className={styles.sectionTitle}>Comments</h2>
      <CommentForm postId={post.id} />

      <div className={styles.commentList}>
        {comments.items.map((c) => (
          <div key={c.id} className={styles.comment}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageOrFallback(c.user?.profile_picture_url)} alt="" className={styles.commentAvatar} />
            <div className={styles.commentBubble}>
              <p className={styles.commentAuthor}>{c.user?.username ?? 'User'}</p>
              <p className={styles.commentContent}>{c.content}</p>
            </div>
          </div>
        ))}
        {comments.items.length === 0 && <p className={styles.postTime}>No comments yet.</p>}
      </div>
    </div>
  );
}
