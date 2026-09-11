import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    assetsInlineLimit: 100000,
    lib: {
      entry: resolve(__dirname, 'src', 'content', 'content.tsx'),
      name: 'VoxaContent',
      fileName: 'content.js',
      formats: ['iife'],
    },
      outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src'),
    },
  },
})
