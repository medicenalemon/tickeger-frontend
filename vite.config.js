import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-red.png'],
      manifest: {
        name: 'Tickeger',
        short_name: 'Tickeger',
        description: 'Sistema de Gestión de Tickets',
        theme_color: '#ff0000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-red.png',
            sizes: '1024x682',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo-red.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo-red.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
