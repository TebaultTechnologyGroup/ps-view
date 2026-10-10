import react from '@vitejs/plugin-react'
import path from "path"
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Match the 127.0.0.1 redirect URLs in supabase/config.toml
    host: '127.0.0.1',
    // In dev, /api/* is served by the Next.js app in ./backend (npm run dev there)
    proxy: { '/api': 'http://localhost:3000' },
  },
})

