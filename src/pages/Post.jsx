import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadPost } from '../data.js';
import { TagList } from '../components/PostItem.jsx';
import { formatDate } from '../format.js';
import { useDocumentTitle } from '../useDocumentTitle.js';
import { useRequest } from '../useRequest.js';
import NotFound from './NotFound.jsx';

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return progress;
}

function wrapCodeBlock(pre) {
  const code = pre.querySelector('code');
  const lang = code?.className.match(/language-(\S+)/)?.[1];

  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  const head = document.createElement('div');
  head.className = 'code-head';
  const label = document.createElement('span');
  label.textContent = lang && lang !== 'plaintext' ? lang : 'text';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '复制';
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code?.innerText ?? pre.innerText);
      button.textContent = '已复制';
    } catch {
      button.textContent = '复制失败';
    }
    setTimeout(() => (button.textContent = '复制'), 1500);
  });
  head.append(label, button);

  pre.replaceWith(wrapper);
  wrapper.append(head, pre);
  return () => wrapper.replaceWith(pre);
}

/** 给正文标题补 id 生成目录，并给代码块加语言标签和复制按钮。 */
function useEnhancedArticle(ref, html) {
  const [toc, setToc] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const used = new Map();
    const headings = [...root.querySelectorAll('h2, h3')];
    setToc(
      headings.map((h) => {
        const base =
          h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        h.id = count ? `${base}-${count}` : base;
        return { id: h.id, text: h.textContent, level: h.tagName === 'H2' ? 2 : 3 };
      }),
    );

    const unwraps = [...root.querySelectorAll('pre')].map(wrapCodeBlock);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    headings.forEach((h) => observer.observe(h));
    return () => {
      observer.disconnect();
      unwraps.forEach((unwrap) => unwrap());
    };
  }, [ref, html]);

  return { toc, activeId };
}

export default function Post() {
  const { slug } = useParams();
  const { data: post, error, loading } = useRequest(() => loadPost(slug), [slug]);
  const html = post?.html ?? '';
  const articleRef = useRef(null);
  const { toc, activeId } = useEnhancedArticle(articleRef, html);
  const progress = useReadingProgress();
  useDocumentTitle(post?.title);

  if (error?.status === 404) return <NotFound />;
  if (error) return <p className="state state-error">文章加载失败：{error.message}</p>;
  if (loading || !post) return <p className="state">正在加载文章…</p>;

  return (
    <>
      <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="post-grid">
        <article className="post">
          <Link to="/" className="back-link">
            ← 全部文章
          </Link>
          <header className="post-header">
            <h1>{post.title}</h1>
            {post.summary && <p className="post-summary">{post.summary}</p>}
            <div className="meta">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span>{post.readingMinutes} 分钟阅读</span>
            </div>
            <TagList tags={post.tags} />
          </header>

          {post.cover && <img className="post-cover" src={post.cover} alt="" />}

          <div ref={articleRef} className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          <nav className="post-nav" aria-label="相邻文章">
            {post.prev ? (
              <Link to={`/posts/${encodeURIComponent(post.prev.slug)}`}>
                <small>← 上一篇</small>
                <span>{post.prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {post.next && (
              <Link to={`/posts/${encodeURIComponent(post.next.slug)}`} className="post-nav-next">
                <small>下一篇 →</small>
                <span>{post.next.title}</span>
              </Link>
            )}
          </nav>
        </article>

        {toc.length > 0 && (
          <aside className="toc" aria-label="目录">
            <p className="panel-title">目录</p>
            <ul>
              {toc.map((item) => (
                <li key={item.id} className={`toc-l${item.level}${item.id === activeId ? ' active' : ''}`}>
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}
