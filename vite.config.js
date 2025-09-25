import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // listen on all network interfaces
    port: 5173,        // your dev server port
    allowedHosts: [
      'revisory-toby-triennially.ngrok-free.dev' // add your ngrok host here
    ]
  }
})