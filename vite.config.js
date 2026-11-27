import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relativ, damit die Seite unabhängig vom Repo-Namen (Pfad auf GitHub Pages) funktioniert
  base: './',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1000 },
})
