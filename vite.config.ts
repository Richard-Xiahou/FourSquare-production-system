import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base:"./",
  plugins: [svelte()],
  optimizeDeps: { 
    exclude: ['@babylonjs/havok'], //优化依赖时忽略 @babylonjs/havok 这个包
  },
})
