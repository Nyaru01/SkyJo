import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(version)
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'mask-icon.svg',
        'bg-skyjo.png',
        'info_premium.png',
        '*.png', // Logos and card backs in root/public
        '*.jpg',
        '*.svg',
        'card-backs/*.svg', // Dos de cartes (famille SVG)
        'avatars/*.png', // Avatars
        'Sounds/*.mp3',  // Game sounds
        'Music/*.mp3',   // Background music
        '*.mp4'          // Intro Videos
      ],
      manifest: {
        id: '/',
        name: 'Vesper',
        short_name: 'Vesper',
        description: 'Vesper, le jeu de cartes au crépuscule : contre l’IA, en ligne entre amis, et le mode Fury.',
        version,
        theme_color: '#1f2233',
        background_color: '#171a2e',
        display: 'standalone',
        orientation: 'portrait',
        // Chemins stables : un horodatage changeant ferait croire à Android que l'icône change à chaque version.
        icons: [
          { src: '/brand/vesper-v-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/brand/vesper-v-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/brand/vesper-v-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/brand/vesper-v-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
