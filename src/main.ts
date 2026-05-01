import { createApp } from 'vue'
import { createBootstrap } from 'bootstrap-vue-next'
import App from './App.vue'
import router from './router'
import { registerSW } from './registerSW'

// Add the necessary CSS imports
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const app = createApp(App)
app.use(createBootstrap()) // Globally register all components, directives, and plugins
app.use(router)
app.mount('#app')
// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  registerSW()
} else {
  console.log('Service Worker is not supported')
}
