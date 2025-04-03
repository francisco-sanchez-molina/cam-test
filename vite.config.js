import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cam-test/', // 👈 Base público para rutas de assets
  build: {
    outDir: 'dist', // (Opcional) Directorio de salida
    assetsDir: 'static' // (Opcional) Directorio de assets
  }
})
