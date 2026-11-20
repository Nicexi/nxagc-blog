import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { blogContent } from './scripts/vite-plugin-blog.mjs';

// BASE_PATH：部署在子路径时设置，例如 GitHub Pages 项目站点 /nxagc-blog/。
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), blogContent()],
});
