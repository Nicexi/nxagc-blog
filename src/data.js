const BASE = import.meta.env.BASE_URL;

async function getJson(path) {
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) {
    const error = new Error(res.status === 404 ? '内容不存在' : `加载失败（${res.status}）`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

let indexPromise;

/** 文章列表在一次页面会话内只请求一次，供首页、标签、归档共用。 */
export function loadPostIndex() {
  indexPromise ??= getJson('posts.json').catch((err) => {
    indexPromise = undefined;
    throw err;
  });
  return indexPromise;
}

export function loadPost(slug) {
  return getJson(`posts/${encodeURIComponent(slug)}.json`);
}

export function countTags(posts) {
  const counts = new Map();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export const assetUrl = (path) => `${BASE}${path.replace(/^\//, '')}`;
