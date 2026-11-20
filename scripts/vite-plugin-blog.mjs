import fs from 'node:fs';
import path from 'node:path';
import { site } from '../src/site.js';
import { loadPosts, POSTS_DIR } from './content.mjs';

const escapeHtml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[c]);

/** 生成前端读取的 JSON：posts.json 为列表与搜索索引，posts/<slug>.json 为正文。 */
function buildDataFiles(posts) {
  const files = new Map();
  files.set('posts.json', JSON.stringify(posts.map(({ html, ...item }) => item)));
  posts.forEach((post, i) => {
    const { searchText, ...detail } = post;
    const older = posts[i + 1];
    const newer = posts[i - 1];
    files.set(
      `posts/${post.slug}.json`,
      JSON.stringify({
        ...detail,
        prev: older ? { slug: older.slug, title: older.title } : null,
        next: newer ? { slug: newer.slug, title: newer.title } : null,
      }),
    );
  });
  return files;
}

function headTags({ title, description, url, image, type, base }) {
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="${base}rss.xml" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.title)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
  ];
  if (image) tags.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
  return tags.join('\n    ');
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** 为每个页面输出独立的 HTML，GitHub Pages 可以直接按路径访问，搜索引擎也能读到标题、描述和正文。 */
function prerender({ outDir, base, siteUrl, posts }) {
  const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const absolute = (url) => (/^https?:\/\//.test(url) ? url : `${siteUrl}${url.slice(base.length - 1)}`);
  const page = (route, meta, body = '') =>
    template
      .replace(/<title>[\s\S]*?<\/title>/, headTags({ type: 'website', ...meta, url: `${siteUrl}${route}`, base }))
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const home = { title: site.title, description: site.description };
  writeFile(path.join(outDir, 'index.html'), page('/', home));
  writeFile(path.join(outDir, '404.html'), page('/404', { ...home, title: `页面不存在 · ${site.title}` }));
  writeFile(path.join(outDir, 'tags/index.html'), page('/tags', { ...home, title: `标签 · ${site.title}` }));
  writeFile(path.join(outDir, 'archive/index.html'), page('/archive', { ...home, title: `归档 · ${site.title}` }));

  for (const post of posts) {
    const body =
      `<main class="site-main container"><article class="post narrow"><h1>${escapeHtml(post.title)}</h1>` +
      `<div class="prose">${post.html}</div></article></main>`;
    const meta = {
      title: `${post.title} · ${site.title}`,
      description: post.summary || site.description,
      image: post.cover ? absolute(post.cover) : '',
      type: 'article',
    };
    writeFile(path.join(outDir, 'posts', post.slug, 'index.html'), page(`/posts/${post.slug}/`, meta, body));
  }

  const rssItems = posts
    .slice(0, 20)
    .map((p) => {
      const link = `${siteUrl}/posts/${p.slug}/`;
      return (
        `<item><title>${escapeHtml(p.title)}</title><link>${link}</link><guid>${link}</guid>` +
        `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` +
        `<description>${escapeHtml(p.summary)}</description>` +
        p.tags.map((t) => `<category>${escapeHtml(t)}</category>`).join('') +
        '</item>'
      );
    })
    .join('');
  writeFile(
    path.join(outDir, 'rss.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeHtml(site.title)}</title>` +
      `<link>${siteUrl}/</link><description>${escapeHtml(site.description)}</description>${rssItems}</channel></rss>`,
  );

  const urls = ['/', '/tags/', '/archive/']
    .map((p) => `<url><loc>${siteUrl}${p}</loc></url>`)
    .concat(posts.map((p) => `<url><loc>${siteUrl}/posts/${p.slug}/</loc><lastmod>${p.updatedAt.slice(0, 10)}</lastmod></url>`));
  writeFile(
    path.join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
  );
  writeFile(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
  // 关闭 GitHub Pages 的 Jekyll 处理，保证所有构建产物原样发布。
  writeFile(path.join(outDir, '.nojekyll'), '');
}

export function blogContent() {
  let base = '/';
  let isDev = false;
  let outDir = 'dist';
  let posts = [];
  let files = new Map();

  const rebuild = () => {
    posts = loadPosts({ base, includeDrafts: isDev });
    files = buildDataFiles(posts);
  };

  return {
    name: 'nxagc-blog-content',

    configResolved(config) {
      base = config.base;
      isDev = config.command === 'serve';
      outDir = path.resolve(config.root, config.build.outDir);
    },

    buildStart() {
      rebuild();
    },

    configureServer(server) {
      rebuild();
      const onChange = (file) => {
        if (!file.startsWith(POSTS_DIR)) return;
        try {
          rebuild();
          server.ws.send({ type: 'full-reload' });
        } catch (err) {
          server.config.logger.error(`[content] ${err.message}`);
        }
      };
      server.watcher.add(POSTS_DIR);
      server.watcher.on('add', onChange).on('change', onChange).on('unlink', onChange);

      const prefix = `${base}data/`;
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]);
        if (!url.startsWith(prefix)) return next();
        const body = files.get(url.slice(prefix.length));
        res.statusCode = body ? 200 : 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(body ?? '{"error":"not found"}');
      });
    },

    generateBundle() {
      for (const [name, source] of files) this.emitFile({ type: 'asset', fileName: `data/${name}`, source });
    },

    closeBundle() {
      if (isDev) return;
      const siteUrl = (process.env.SITE_URL || `http://localhost:4173${base}`).replace(/\/$/, '');
      prerender({ outDir, base, siteUrl, posts });
    },
  };
}
