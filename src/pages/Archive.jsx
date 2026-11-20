import { Link } from 'react-router-dom';
import { loadPostIndex } from '../data.js';
import { formatDate } from '../format.js';
import { useDocumentTitle } from '../useDocumentTitle.js';
import { useRequest } from '../useRequest.js';

function groupByYear(posts) {
  const groups = new Map();
  for (const post of posts) {
    const year = new Date(post.publishedAt).getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(post);
  }
  return [...groups];
}

export default function Archive() {
  useDocumentTitle('归档');
  const { data, error, loading } = useRequest(loadPostIndex, []);

  return (
    <section className="narrow">
      <header className="page-head">
        <h1>归档</h1>
        {data && <p>共 {data.length} 篇文章。</p>}
      </header>
      {error && <p className="state state-error">归档加载失败：{error.message}</p>}
      {loading && <p className="state">正在加载归档…</p>}
      {data?.length === 0 && <p className="state">还没有发布文章。</p>}
      {data &&
        groupByYear(data).map(([year, posts]) => (
          <section key={year} className="archive-year">
            <h2>
              {year}
              <span>{posts.length} 篇</span>
            </h2>
            <ol className="timeline">
              {posts.map((post) => (
                <li key={post.slug}>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt).slice(5)}</time>
                  <Link to={`/posts/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
    </section>
  );
}
