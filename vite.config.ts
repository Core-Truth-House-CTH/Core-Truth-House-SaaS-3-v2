import { defineConfig } from 'vite'
import guardedConfig from './vite.config.js'
import { productionApiOrigin } from './config/production-api.mjs'

// Staging delegates unchanged to the guarded implementation. Existing explicit
// non-staging .ts development usage keeps its previous bind address and proxy.
export default defineConfig(context => {
  const config = guardedConfig(context)
  if (context.mode === 'staging') return config
  return {
    ...config,
    server: {
      ...config.server,
      host: '0.0.0.0',
      proxy: {
        '/api': { target: productionApiOrigin, changeOrigin: true, secure: true },
      },
    },
  }
})
