import { defineConfig, loadEnv } from 'vite'
import { validateStripePublishableKey } from './scripts/stripe-publishable-key-guard.mjs'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  if (mode === "production") {
    validateStripePublishableKey(loadEnv(mode, process.cwd(), "VITE_"));
  }
  return {
  plugins: [react()],
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
