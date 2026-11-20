import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import hljs from 'highlight.js/lib/common';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

export const POSTS_DIR = path.resolve('content/posts');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 以 / 开头的站内地址补上部署子路径，例如 /images/a.png → /nxagc-blog/images/a.png */
export function withBase(url, base) {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  return base.replace(/\/$/, '') + url;
}

function createMarkdown(base) {
  return new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
    {
      gfm: true,
      walkTokens(token) {
        if (token.type === 'image' || token.type === 'link') token.href = withBase(token.href, base);
      },
    },
  );
}

/** 中文按每分钟 400 字、英文按每分钟 200 词估算。 */
function estimateReadingMinutes(text) {
  const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const words = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function toPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIso(value, file, field) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${file}: ${field} 不是合法日期`);
  return date.toISOString();
}

/** 读取全部文章，按发布时间倒序返回；frontmatter 不合法时直接报错，避免发布残缺内容。 */
export function loadPosts({ base = '/', includeDrafts = false } = {}) {
  const md = createMarkdown(base);
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const slug = file.slice(0, -3);
    if (!SLUG_PATTERN.test(slug)) throw new Error(`${file}: 文件名只能包含小写字母、数字和连字符`);
    const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'));
    if (!data.title) throw new Error(`${file}: 缺少 title`);
    if (!data.date) throw new Error(`${file}: 缺少 date`);
    const text = toPlainText(content);
    return {
      slug,
      title: String(data.title),
      summary: String(data.summary ?? ''),
      cover: withBase(data.cover ? String(data.cover) : '', base),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      draft: data.draft === true,
      publishedAt: toIso(data.date, file, 'date'),
      updatedAt: toIso(data.updated ?? data.date, file, 'updated'),
      readingMinutes: estimateReadingMinutes(text),
      searchText: text.toLowerCase(),
      html: md.parse(content),
    };
  });

  return posts
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
