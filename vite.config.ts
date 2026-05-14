import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    vueDevTools(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  optimizeDeps: {
    include: ['@huggingface/transformers'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/variables.scss" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/omlx': {
        target: `http://127.0.0.1:${process.env.VITE_OMLX_PORT || '8888'}`,
        changeOrigin: true,
        rewrite: (path) => {
          if (path.includes('/audio/')) {
            return path.replace(/^\/omlx/, '')
          }
          return path.replace(/^\/omlx/, '/v1')
        },
      },
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        sw: fileURLToPath(new URL('./src/sw.ts', import.meta.url)),
      },
      output: {
        // Keep sw.js at the root, everything else in assets/
        entryFileNames: (chunk) => {
          if (chunk.name === 'sw') return 'sw.js'
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      plugins: [
        {
          name: 'build-manifest',
          generateBundle(options, bundle) {
            const manifest = Object.keys(bundle).filter(
              (file) =>
                file !== 'sw.js' &&
                !file.endsWith('.map') &&
                file !== 'index.html' &&
                !file.startsWith('icon-'),
            )
            this.emitFile({
              type: 'asset',
              fileName: 'cache-manifest.json',
              source: JSON.stringify(manifest),
            })
          },
        },
      ],
    },
  },
})
