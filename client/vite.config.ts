/// <reference types="vitest/config" />
// `defineConfig` bilerek 'vite'ten degil 'vitest/config'ten aliniyor: ikisi ayni
// yapilandirmayi uretir, ama yalniz bu ikincisi `test` alanini TANIR. 'vite'ten
// alinirsa `test` bloguna tsc "boyle bir alan yok" der ve tip denetimi kirilir.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet', 'react-leaflet'],
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  test: {
    // jsdom: bilesenlerin CALISMA ANI davranisini olcebilmek icin. Kapinin
    // bugune kadarki tek olcusu `tsc`ydi ve tsc "bu dal hic calisiyor mu"
    // sorusunu goremez — 20.08'de rol kapisinin calisma ani davranisina
    // yazilan bir mutasyon tam bu yuzden kacmisti.
    environment: 'jsdom',
    // `globals` bilerek KAPALI: acik olsaydi tsconfig.app.json'daki
    // "types": ["vite/client"] listesine "vitest/globals" eklemek gerekirdi ve
    // o liste ayni zamanda uygulama kodunun tip yuzeyi. Testler `describe`,
    // `it`, `expect`, `vi`yi acikca import ediyor — tsc de boylece onlari
    // uygulama kodunda gormuyor.
    setupFiles: ['./src/test/setup.ts'],
    // Yalniz kaynak agacindaki testler; node_modules ve dist taranmasin.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
