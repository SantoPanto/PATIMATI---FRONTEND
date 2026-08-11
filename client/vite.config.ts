import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Vite varsayilani 5173, ama backend'in CORS ayari yalnizca
  // http://localhost:3000 ve http://localhost:4200 adreslerine izin veriyor
  // (SecurityConfig.corsConfigurationSource). 5173'te acilirsa istek koda
  // hic ulasmadan tarayici tarafindan engellenir ve sebebi ag sekmesinde
  // "CORS" diye gorunur; kodda hicbir hata olmadigi icin bulmasi zordur.
  // strictPort: port doluysa sessizce baska porta kaymasin, hata versin.
  server: {
    port: 3000,
    strictPort: true,
  },
})