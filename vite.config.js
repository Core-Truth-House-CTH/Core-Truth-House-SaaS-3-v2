import { defineConfig, loadEnv } from 'vite'
import { validateStripePublishableKey } from './scripts/stripe-publishable-key-guard.mjs'
import { readPinnedOrigin } from './scripts/staging-api-guard.mjs'
import { stagingVitePlugin } from './scripts/staging-vite-plugin.mjs'
import { productionApiOrigin } from './config/production-api.mjs'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode, command }) => {
  const staging = mode === 'staging'
  if (process.env.CTH_BUILD_TARGET === 'staging' && !staging) {
    throw new Error('Staging API guard: requested staging target requires Vite staging mode')
  }
  if (staging && command !== 'build') {
    throw new Error('Staging API guard: staging mode supports only guarded builds')
  }
  const env = loadEnv(mode, root, 'VITE_')
  if (mode === 'production') validateStripePublishableKey(env)
  const output = staging
    ? path.resolve(root, process.env.CTH_STAGING_OUT_DIR || '.artifacts/staging/vite-' + randomUUID())
    : 'dist'
  const origin = staging ? readPinnedOrigin(root) : ''
  return {
    root,
    envDir: root,
    envPrefix: 'VITE_',
    plugins: [
      react(),
      ...(staging ? [stagingVitePlugin({ root, env, output })] : []),
    ],
    define: {
      'import.meta.env.CTH_API_FALLBACK': JSON.stringify(staging ? '' : productionApiOrigin),
      'import.meta.env.CTH_STAGING_API_ORIGIN': JSON.stringify(origin),
    },
    resolve: { alias: { '@': path.resolve(root, './src') } },
    server: { port: 3000 },
    build: {
      outDir: output,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react'
              if (id.includes('lucide-react')) return 'vendor-ui'
              if (id.includes('recharts')) return 'vendor-charts'
              if (id.includes('marked') || id.includes('dompurify')) return 'vendor-editor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
