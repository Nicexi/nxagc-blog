import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { countTags, loadPostIndex } from '../data.js';
import { useDocumentTitle } from '../useDocumentTitle.js';
import { useRequest } from '../useRequest.js';

export default function Tags() {
  useDocumentTitle('标签');
  const { data: posts, error, loading } = useRequest(loadPostIndex, []);
  const data = useMemo(() => (posts ? countTags(posts) : null), [posts]);

  return (
    <section className="narrow">
      <header className="page-head">
        <h1>标签</h1>
        {data && <p>{data.length} 个标签，点击查看相关文章。</p>}
      </header>
      {error && <p className="state state-error">标签加载失败：{error.message}</p>}
      {loading && <p className="state">正在加载标签…</p>}
      {data?.length === 0 && <p className="state">已发布的文章还没有标签。</p>}
      {data?.length > 0 && (
        <ul className="tag-grid">
          {data.map((tag) => (
            <li key={tag.name}>
              <Link to={`/?tag=${encodeURIComponent(tag.name)}`}>
                <span className="tag-grid-name">{tag.name}</span>
                <span className="tag-grid-count">{tag.count} 篇</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
