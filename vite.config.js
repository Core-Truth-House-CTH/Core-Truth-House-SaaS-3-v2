import { defineConfig, loadEnv } from 'vite'
import { validateStripePublishableKey } from './scripts/stripe-publishable-key-guard.mjs'
import { productionApiOrigin } from './config/production-api.mjs'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  if (mode === "production") {
    validateStripePublishableKey(loadEnv(mode, process.cwd(), "VITE_"));
  }
  return {
  plugins: [react()],
  // Default API address for pages with no VITE_API_BASE_URL. Production keeps the
  // production address; a staging build gets none (it must set VITE_API_BASE_URL).
  // A plain constant, not import.meta.env.*, so no shared env table in the bundle changes.
  define: {
    __CTH_API_DEFAULT__: JSON.stringify(mode === 'staging' ? '' : productionApiOrigin),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
              return 'vendor-react'
            }
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
