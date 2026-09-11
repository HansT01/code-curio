import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import { solidStart } from '@solidjs/start/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [solidStart(), tailwindcss(), nitro()],
  // These are only ever imported lazily by @solidjs/start's dev toolbar error viewer
  // (once an actual error is shown), so Vite's initial dependency crawl never finds
  // them. Without pre-bundling them upfront, the browser is served the raw CJS files
  // directly (no named exports), throwing "does not provide an export named ...".
  optimizeDeps: {
    include: ['source-map-js', 'error-stack-parser', 'html-to-image'],
  },
  nitro: {
    preset: 'cloudflare-pages',
    serverDir: './server',
    features: {
      websocket: true,
    },
  },
})
