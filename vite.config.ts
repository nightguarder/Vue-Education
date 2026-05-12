import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'

// https://vite.dev/config/
export default defineConfig({
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
          // Don't rewrite audio endpoints
          if (path.includes('/audio/')) {
            return path.replace(/^\/omlx/, '')
          }
          return path.replace(/^\/omlx/, '/v1')
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[OMLX Proxy Error]', err.message)
          })
        }
      },
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/pmc': {
        target: 'https://pmc.ncbi.nlm.nih.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pmc/, '/articles'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      '/pmc-cdn': {
        target: 'https://www.ncbi.nlm.nih.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pmc-cdn/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        /* Automatic build-time manifest */
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
              name: 'cache-manifest.json',
            })
          },
        },
      ],
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        sw: fileURLToPath(new URL('./src/sw.ts', import.meta.url)),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
