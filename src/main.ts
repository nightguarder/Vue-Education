import { createApp } from 'vue'
import App from './App.vue'
import { registerSW } from './registerSW'

createApp(App).mount('#app')
// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  registerSW()
} else {
  console.log('Service Worker is not supported')
}
