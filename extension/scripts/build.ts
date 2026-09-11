import { build } from 'vite'
import { copyFileSync, cpSync, renameSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { build as esbuild } from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runBuild() {
  // Build popup (multi-page)
  await build({
    configFile: resolve(__dirname, '..', 'vite.config.ts'),
  })

  // Build content script (single file with all deps inlined)
  await build({
    configFile: resolve(__dirname, '..', 'vite.content.config.ts'),
  })

  // Build service worker
  await esbuild({
    entryPoints: [resolve(__dirname, '..', 'src', 'background', 'serviceWorker.ts')],
    bundle: true,
    platform: 'browser',
    target: ['es2020'],
    outfile: resolve(__dirname, '..', 'dist', 'background.js'),
    format: 'iife',
  })

  const distDir = resolve(__dirname, '..', 'dist')

  // Rename content script output to content.js
  const iifePath = resolve(distDir, 'content.js.iife.js')
  const finalPath = resolve(distDir, 'content.js')
  if (existsSync(iifePath)) {
    renameSync(iifePath, finalPath)
  }

  copyFileSync(
    resolve(__dirname, '..', 'public', 'manifest.json'),
    resolve(distDir, 'manifest.json')
  )

  try {
    cpSync(
      resolve(__dirname, '..', 'public', 'icons'),
      resolve(distDir, 'icons'),
      { recursive: true }
    )
  } catch {
    // Icons might not exist yet
  }
}

runBuild().catch(console.error)
