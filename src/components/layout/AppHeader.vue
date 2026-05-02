<template>
  <BNavbar toggleable="lg" type="light" class="site-header" container="lg">
    <BNavbarBrand>
      <RouterLink to="/" class="navbar-brand">Education Platform</RouterLink>
    </BNavbarBrand>

    <BNavbarToggle target="navbarNav" />

    <BCollapse id="navbarNav" is-nav class="justify-content-end">
      <BNavbarNav>
        <RouterLink class="nav-link px-3" to="/">Home</RouterLink>
        <RouterLink class="nav-link px-3" to="/patients/home">Patient Portal</RouterLink>
        <RouterLink class="nav-link px-3" to="/patients/resources">Resources</RouterLink>
        <RouterLink class="nav-link px-3" to="/doctors/education">Doctor Portal</RouterLink>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { BNavbar, BNavbarToggle, BCollapse, BNavbarNav, BNavbarBrand } from "bootstrap-vue-next";
</script>

<style scoped>
.site-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 0;
}
.navbar-brand {
  font-weight: 600;
  color: #2c5282;
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
  color: #2c5282 !important;
}
.router-link-active {
  color: #2c5282 !important;
  font-weight: 500;
}
</style>
