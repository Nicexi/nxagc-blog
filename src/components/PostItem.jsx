import { Link } from 'react-router-dom';
import { formatDate } from '../format.js';

export function TagList({ tags }) {
  if (!tags?.length) return null;
  return (
    <ul className="tag-list">
      {tags.map((tag) => (
        <li key={tag}>
          <Link to={`/?tag=${encodeURIComponent(tag)}`} className="tag">
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function PostItem({ post }) {
  return (
    <article className={`post-card${post.cover ? ' has-cover' : ''}`}>
      <div className="post-card-body">
        <div className="meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span>{post.readingMinutes} 分钟阅读</span>
        </div>
        <h2>
          <Link to={`/posts/${encodeURIComponent(post.slug)}`} className="post-card-link">
            {post.title}
          </Link>
        </h2>
        {post.summary && <p className="post-card-summary">{post.summary}</p>}
        <TagList tags={post.tags} />
      </div>
      {post.cover && <img className="post-card-cover" src={post.cover} alt="" loading="lazy" />}
    </article>
  );
}
