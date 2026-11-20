import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('页面不存在');
  return (
    <section className="not-found">
      <p className="not-found-code">404</p>
      <h1>这个页面不存在</h1>
      <p>链接可能写错了，或者文章已经下线。</p>
      <Link to="/" className="btn">返回文章列表</Link>
    </section>
  );
}
