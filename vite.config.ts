import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2020',
    // three.js vive en un chunk diferido (solo lo pide el hero 3D)
    chunkSizeWarningLimit: 1000,
  },
})
