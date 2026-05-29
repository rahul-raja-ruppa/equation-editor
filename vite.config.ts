import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/equation-editor/' : '/',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mathlive': ['mathlive'],
        },
      },
    },
  },
}))
