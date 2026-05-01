<template>
  <div class="app-layout d-flex flex-column min-vh-100">
    <AppHeader />
    <main class="app-content flex-grow-1">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
</script>

<style scoped>
.app-content {
  padding: 20px;
}
</style>
