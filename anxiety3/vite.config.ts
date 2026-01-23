import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // anxiety: resolve(__dirname, 'anxiety.html'), // Removed
        dyslexia: resolve(__dirname, 'dyslexia.html'),
        discalculia: resolve(__dirname, 'discalculia.html'),
      },
    },
  },
})
