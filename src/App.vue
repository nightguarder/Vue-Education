<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
</script>

<template>
  <BApp>
    <AppLayout />
  </BApp>
</template>

<style lang="scss">
@use 'sass:color';
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

body {
  margin: 0;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background-color: #f8f9fa;
  color: #333;
}

/* Override Bootstrap colors */
.text-primary {
  color: $primary-color !important;
}

.text-success {
  color: $secondary-color !important;
}

.bg-primary {
  background-color: $primary-color !important;
}

.bg-success {
  background-color: $secondary-color !important;
}

.border-primary {
  border-color: $primary-color !important;
}

.btn-primary {
  background-color: $primary-color;
  border-color: $primary-color;
}

.btn-primary:hover {
  background-color: color.adjust($primary-color, $lightness: -10%);
  border-color: color.adjust($primary-color, $lightness: -10%);
}

.btn-success {
  background-color: $secondary-color;
  border-color: $secondary-color;
}
</style>
