import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/cam-test/', // 👈 Base público para rutas de assets
  build: {
    outDir: 'dist', // (Opcional) Directorio de salida
    assetsDir: 'static' // (Opcional) Directorio de assets
  },
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
})
