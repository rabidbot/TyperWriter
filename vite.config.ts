import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Electron loads the built HTML through file://, so assets must be relative.
  base: './',
  plugins: [react()],
})
