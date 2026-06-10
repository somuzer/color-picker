import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      name: 'YidianColorPicker',
      formats: ['es', 'iife'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.iife.js',
    },
  },
})
