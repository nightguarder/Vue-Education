/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'vue-edu-cache-v1'

// 1. Install event - pre-cache assets from the manifest
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const response = await fetch('/cache-manifest.json')
        if (!response.ok) throw new Error('Manifest not found')
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
           throw new Error('Manifest is not JSON (likely security challenge)')
        }

        const assets: string[] = await response.json()

        // Deduplicate and add root/assets AND the manifests to cache
        // Note: Using both potential manifest names to be safe
        const toCache = new Set([
          '/',
          '/index.html',
          '/cache-manifest.json',
          '/manifest.webmanifest',
          '/favicon_io/site.webmanifest',
          ...assets,
        ])
        await cache.addAll(Array.from(toCache))

        console.info('PWA: Pre-caching successful')
      } catch (error) {
        console.error('PWA: Pre-caching failed:', error)
        // Minimum fallback
        await cache.addAll(['/', '/index.html'])
      }
      return self.skipWaiting()
    })(),
  )
})

// 2. Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      )
      return self.clients.claim()
    })(),
  )
})

// 3. Fetch event - Bulletproof Offline Strategy (Stale-While-Revalidate)
self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(event.request)

      // We start the network fetch
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // If network is up, update cache for next time
          if (networkResponse.ok) {
            const contentType = networkResponse.headers.get('content-type')
            const isHtml = contentType && contentType.includes('text/html')
            const expectsHtml = event.request.headers.get('Accept')?.includes('text/html')

            // SAFETY: Never cache HTML unless we explicitly expected it (e.g. index.html)
            // This prevents InfinityFree's 'aes.js' challenge from poisoning the cache
            if (isHtml && !expectsHtml && !event.request.url.endsWith('/') && !event.request.url.endsWith('index.html')) {
              console.warn('PWA: Refusing to cache HTML for non-HTML request:', event.request.url)
              return networkResponse
            }

            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        })
        .catch((error) => {
          // If network is DOWN (server closed), return cache
          if (cachedResponse) return cachedResponse
          // If nothing in cache and network is down
          throw error
        })

      // Return cache immediately if available, otherwise wait for network
      return cachedResponse || networkFetch
    })(),
  )
})
