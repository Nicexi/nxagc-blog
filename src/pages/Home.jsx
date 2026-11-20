import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { assetUrl, countTags, loadPostIndex } from '../data.js';
import Pagination from '../components/Pagination.jsx';
import PostItem from '../components/PostItem.jsx';
import { site } from '../site.js';
import { useDocumentTitle } from '../useDocumentTitle.js';
import { useRequest } from '../useRequest.js';

const PAGE_SIZE = 10;

function Sidebar({ tags, activeTag }) {
  return (
    <aside className="home-aside">
      <section className="panel">
        <h3 className="panel-title">关于</h3>
        <p className="panel-text">{site.description}</p>
        <a className="panel-link" href={assetUrl('rss.xml')}>
          通过 RSS 订阅更新
        </a>
      </section>
      {tags?.length > 0 && (
        <section className="panel">
          <h3 className="panel-title">标签</h3>
          <ul className="chip-list">
            {tags.map((tag) => (
              <li key={tag.name}>
                <Link
                  to={tag.name === activeTag ? '/' : `/?tag=${encodeURIComponent(tag.name)}`}
                  className={`chip${tag.name === activeTag ? ' active' : ''}`}
                  aria-current={tag.name === activeTag ? 'true' : undefined}
                >
                  {tag.name}
                  <span>{tag.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  const filtered = Boolean(tag || q);

  useDocumentTitle(tag ? `标签：${tag}` : q ? `搜索：${q}` : '');

  const { data: posts, error, loading } = useRequest(loadPostIndex, []);
  const tags = useMemo(() => (posts ? countTags(posts) : []), [posts]);

  const data = useMemo(() => {
    if (!posts) return null;
    const keyword = q.toLowerCase();
    const matched = posts.filter(
      (p) =>
        (!tag || p.tags.includes(tag)) &&
        (!keyword ||
          p.title.toLowerCase().includes(keyword) ||
          p.summary.toLowerCase().includes(keyword) ||
          p.tags.some((t) => t.toLowerCase().includes(keyword)) ||
          p.searchText.includes(keyword)),
    );
    const start = (page - 1) * PAGE_SIZE;
    return { items: matched.slice(start, start + PAGE_SIZE), total: matched.length, page, pageSize: PAGE_SIZE };
  }, [posts, tag, q, page]);

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set('page', String(p));
    else next.delete('page');
    setSearchParams(next);
  };

  return (
    <>
      {!filtered && page === 1 && (
        <section className="hero">
          <h1>
            {site.tagline}
            <span className="caret" aria-hidden="true" />
          </h1>
          <p>{site.description}</p>
        </section>
      )}

      <div className="home-grid">
        <section className="home-main" aria-labelledby="post-list-title">
          <div className="section-head">
            <h2 id="post-list-title">
              {tag ? `标签：${tag}` : q ? `搜索“${q}”` : '最新文章'}
            </h2>
            {data && <span className="section-count">{data.total} 篇</span>}
            {filtered && (
              <Link to="/" className="section-clear">
                查看全部文章
              </Link>
            )}
          </div>

          {error && <p className="state state-error">文章加载失败：{error.message}</p>}
          {loading && !data && <p className="state">正在加载文章…</p>}
          {data && data.items.length === 0 && (
            <div className="empty">
              <p>{filtered ? '没有找到匹配的文章，换个关键词试试。' : '还没有发布文章。'}</p>
              {filtered && (
                <Link to="/" className="btn">
                  查看全部文章
                </Link>
              )}
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="post-list">
              {data.items.map((post) => (
                <PostItem key={post.slug} post={post} />
              ))}
            </div>
          )}

          {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={goToPage} />}
        </section>

        <Sidebar tags={tags} activeTag={tag} />
      </div>
    </>
  );
}
