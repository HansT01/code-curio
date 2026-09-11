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
    // cloudflare-pages Functions don't share in-memory state across connections, so the
    // WebRTC signaling relay (server/routes/ws.ts) silently failed to route messages between
    // peers in production. cloudflare-durable runs the same websocket hooks inside a single
    // Durable Object instance instead, giving them one real shared, persistent coordinator.
    preset: 'cloudflare-durable',
    serverDir: './server',
    // Pinned (not left to default to "today"): workerd/wrangler reject compatibility dates
    // it doesn't know about yet, so an auto "today" date breaks builds until wrangler updates.
    compatibilityDate: '2024-09-19',
    features: {
      websocket: true,
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        // Without this, nitro auto-derives a name (came out as "hanst01-code-curio"),
        // giving an uglier *.workers.dev URL than an explicit name does.
        name: 'code-curio',
        durable_objects: {
          bindings: [{ name: '$DurableObject', class_name: '$DurableObject' }],
        },
        migrations: [{ tag: 'v1', new_sqlite_classes: ['$DurableObject'] }],
      },
    },
  },
})
