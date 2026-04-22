import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // We will provide manifest.json manually in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: []
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
