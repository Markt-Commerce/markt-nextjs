import Link from 'next/link';
import { Heart, MessageCircle, PenSquare } from 'lucide-react';
import { getForwardedCookie, requireSession } from '@/lib/api/session';
import { getUserPosts, getMyDrafts, getMyArchived } from '@/lib/api/social';
import { safeFetch } from '@/lib/api/safe';
import { postThumbnail, type Post } from '@/lib/types/post';
import { ManageActions } from './manage-actions';
import styles from './page.module.css';

type Tab = 'published' | 'drafts' | 'archived';

const TABS: { key: Tab; label: string }[] = [
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
];

export default async function MyPostsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === 'drafts' || tabParam === 'archived' ? tabParam : 'published';

  const cookie = await getForwardedCookie();
  const user = await requireSession();

  let posts: Post[] = [];
  if (tab === 'published') {
    const res = await safeFetch(() => getUserPosts(user.id, cookie), { items: [], pagination: { page: 1, per_page: 50, total_items: 0, total_pages: 0 } });
    posts = res.items;
  } else if (tab === 'drafts') {
    posts = await safeFetch(() => getMyDrafts(cookie), []);
  } else {
    posts = await safeFetch(() => getMyArchived(cookie), []);
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>My Posts</h1>
          <p className={styles.subtitle}>Manage everything you&apos;ve shared with the community.</p>
        </div>
        <Link href="/app/community/social-feed" className={styles.newBtn}>
          <PenSquare size={15} /> New post
        </Link>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'published' ? '/app/community/my-posts' : `/app/community/my-posts?tab=${t.key}`}
            className={tab === t.key ? styles.tabActive : styles.tab}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className={styles.emptyState}>
          {tab === 'published' && 'You have no published posts yet.'}
          {tab === 'drafts' && 'No drafts saved.'}
          {tab === 'archived' && 'Nothing archived.'}
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map((post) => {
            const image = postThumbnail(post);
            return (
              <article key={post.id} className={styles.row}>
                <div className={styles.thumbWrap}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbEmpty}>
                      <PenSquare size={18} />
                    </div>
                  )}
                </div>

                <div className={styles.rowBody}>
                  <p className={styles.caption}>{post.caption?.trim() || 'Untitled post'}</p>
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <Heart size={13} /> {post.like_count}
                    </span>
                    <span className={styles.metaItem}>
                      <MessageCircle size={13} /> {post.comment_count}
                    </span>
                    <span className={styles.metaDate}>{new Date(post.created_at).toLocaleDateString()}</span>
                    {tab === 'published' && (
                      <Link href={`/app/community/post/${post.id}`} className={styles.viewLink}>
                        View
                      </Link>
                    )}
                  </div>
                  <ManageActions postId={post.id} tab={tab} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
