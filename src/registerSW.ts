/* Vue interact with service worker */
export function registerSW() {
  // Skip service worker registration in development mode
  if (import.meta.env.DEV) {
    return
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        //console.info('SW registered:', registration.scope)

        // Handle updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (installingWorker == null) return

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.info('New content is available; please refresh.')
              } else {
                console.info('Content is cached for offline use.')
              }
            }
          }
        }
      } catch (error) {
        console.error('Error during service worker registration:', error)
      }
    })

    // Handle controller change (e.g. when skipWaiting() is called)
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  }
}
