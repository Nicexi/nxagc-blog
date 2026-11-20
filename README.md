# NxAGC

纯静态技术博客：React 19 + Vite，文章是仓库里的 Markdown 文件，推送到 `main` 后由 GitHub Actions 构建并发布到 GitHub Pages。

## 写文章

在 `content/posts/` 新建 `文章链接.md`，文件名只能包含小写字母、数字和连字符，它就是文章地址 `/posts/文章链接/`。

```markdown
---
title: "文章标题"
date: 2026-11-20T10:00:00+08:00
updated: 2026-11-21T10:00:00+08:00   # 可选
summary: "显示在列表和分享卡片中的摘要"
tags: ["AI 开发", "工程规范"]
cover: "/images/cover.png"            # 可选
draft: true                           # 可选，草稿只在本地预览中显示
---

正文使用 Markdown，代码块写上语言即可高亮。
```

图片放在 `public/images/`，在文章中写 `![说明](/images/xxx.png)`，构建时会自动补上部署子路径。

## 本地预览

```bash
npm install
npm run dev        # 修改 Markdown 后页面自动刷新
npm run build && npm run preview
```

## 发布

推送到 `main` 即自动发布。仓库需在 Settings → Pages 中将 Source 设为 GitHub Actions。

构建产物包含每篇文章的独立 HTML（含标题、描述、分享卡片和正文）、`rss.xml`、`sitemap.xml` 与 `robots.txt`。站点名称和简介在 `src/site.js` 中修改。
