import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
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
