import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // The Express server handles /api on :3000
    proxy: { '/api': 'http://localhost:3000' },
    // Allow Cloudflare quick-tunnel hostnames when tunnelling the dev server
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    include: ['server/**/*.test.js', 'src/**/*.test.js'],
  },
})
