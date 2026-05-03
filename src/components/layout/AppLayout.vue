<template>
  <div class="app-layout d-flex flex-column min-vh-100">
    <AppHeader />
    <main class="app-content flex-grow-1">
      <div class="container-fluid max-width-container">
        <Breadcrumbs />
        <router-view />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import Breadcrumbs from './Breadcrumbs.vue'
</script>

<style scoped>
.app-content {
  padding: 20px 0;
}
.max-width-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
