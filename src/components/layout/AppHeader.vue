<template>
  <BNavbar toggleable="lg" type="light" class="site-header" container="lg">
    <BNavbarBrand>
      <RouterLink to="/" class="navbar-brand">Vzdělávací platforma</RouterLink>
    </BNavbarBrand>

    <BNavbarToggle target="navbarNav" />

    <BCollapse id="navbarNav" is-nav class="justify-content-end">
      <BNavbarNav>
        <RouterLink class="nav-link px-3" to="/">Domů</RouterLink>
        <RouterLink class="nav-link px-3" to="/patients/home">Portál pro pacienty</RouterLink>
        <RouterLink class="nav-link px-3" to="/doctors/education">Portál pro lékaře</RouterLink>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped lang="scss">
.site-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 0;
}
.navbar-brand {
  font-weight: 600;
  color: $primary-color;
  text-decoration: none;
  font-size: 1.25rem;
}
.nav-link {
  color: #4a5568 !important;
  font-size: 1rem;
  text-decoration: none;
}
.nav-link:hover,
.nav-link:focus {
  color: $primary-color !important;
}
.router-link-active {
  color: $primary-color !important;
  font-weight: 500;
}
</style>
