import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getPost, getPostComments } from '@/lib/api/social';
import { getPublicProfile } from '@/lib/api/account';
import { safeFetch } from '@/lib/api/safe';
import { postThumbnail } from '@/lib/types/post';
import { imageOrFallback } from '@/lib/img';
import { LikeButton } from '../../like-button';
import { FollowButton } from '../../follow-button';
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

  const image = postThumbnail(post);
  const taggedProductId = post.products?.[0]?.product_id;
  const isOwnPost = post.user_id === user.id;

  // Seed the follow button with the real state so it doesn't reset to "Follow"
  // after a refresh once you've already followed the author.
  const authorProfile = isOwnPost ? null : await safeFetch(() => getPublicProfile(post.user_id, cookie), null);

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link href="/app/community/social-feed">Community</Link> / Post
      </nav>

      <article className={styles.postCard}>
        <div className={styles.postHead}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageOrFallback(post.user?.profile_picture_url)} alt="" className={styles.avatar} />
          <div>
            <p className={styles.authorName}>{post.user?.username ?? 'User'}</p>
            <p className={styles.postTime}>{new Date(post.created_at).toLocaleString()}</p>
          </div>
          {!isOwnPost && <FollowButton userId={post.user_id} initialFollowing={authorProfile?.is_followed ?? false} />}
        </div>

        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className={styles.postImage} />
        )}

        <div className={styles.postBody}>
          {post.caption && <p className={styles.caption}>{post.caption}</p>}
          {taggedProductId && (
            <Link
              href={`/app/marketplace/product/${taggedProductId}`}
              className={styles.caption}
              style={{ display: 'block', color: 'var(--brand-text)', fontWeight: 700 }}
            >
              View tagged product
            </Link>
          )}

          <div className={styles.actionsRow}>
            <LikeButton postId={post.id} initialCount={post.like_count} className={styles.actionBtn} activeClassName={styles.actionBtnLiked} />
            <span className={styles.actionBtn}>
              <MessageCircle size={16} /> {post.comment_count}
            </span>
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
