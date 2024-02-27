import { defineConfig } from '@solidjs/start/config'
import netlify from 'solid-start-netlify'
import solid from 'solid-start/vite'

export default defineConfig({
  plugins: [
    solid({
      adapter: netlify({ edge: true }),
    }),
  ],
})
