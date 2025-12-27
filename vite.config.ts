
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 大哥注意：呢到個 base 必須同你 GitHub 個 repo 名字一樣
  base: '/taiwun2/', 
});
