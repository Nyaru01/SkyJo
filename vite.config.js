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
        'rival/*.webp', // Île au loin du duel IA (hors ligne)
        'Sounds/*.mp3',  // Game sounds
        'Music/*.mp3',   // Background music
        '*.mp4'          // Intro Videos
      ],
      // Un seul manifeste : public/manifest.json (déclaré dans index.html, c'est lui que Chrome lit).
      // Le plugin en générait un second (manifest.webmanifest) que Chrome ignorait.
      // Icônes : changer leur adresse (?v=…) est le seul moyen pour qu'Android mette à jour l'icône installée
      // (depuis Chrome 144, une adresse inchangée = icône inchangée, l'image n'est plus retéléchargée).
      manifest: false,
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
