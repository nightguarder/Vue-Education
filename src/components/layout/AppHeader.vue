<template>
  <BNavbar toggleable="lg" type="light" class="site-header" container="lg">
    <BNavbarBrand>
      <RouterLink to="/" class="navbar-brand">Education Platform</RouterLink>
    </BNavbarBrand>

    <BNavbarToggle target="navbarNav" />

    <BCollapse id="navbarNav" is-nav class="justify-content-end">
      <BNavbarNav>
        <RouterLink class="nav-link px-3" to="/">Home</RouterLink>
        <BNavItemDropdown text="Patient Portal">
          <BDropdownItem :to="'/patients/home'">
            <i class="bi bi-house me-2"></i>Dashboard
          </BDropdownItem>
          <BDropdownItem :to="'/patients/worksheets'">
            <i class="bi bi-journal-text me-2"></i>Worksheets
          </BDropdownItem>
          <BDropdownItem :to="'/patients/resources'">
            <i class="bi bi-images me-2"></i>Infographics
          </BDropdownItem>
          <BDropdownItem :to="'/patients/audio'">
            <i class="bi bi-headphones me-2"></i>Audio Library
          </BDropdownItem>
          <BDropdownItem :to="'/patients/stress'">
            <i class="bi bi-heart me-2"></i>Stress Relief
          </BDropdownItem>
        </BNavItemDropdown>
        <BNavItemDropdown text="Doctor Portal">
          <BDropdownItem :to="'/doctor/home'">
            <i class="bi bi-house me-2"></i>Home
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/chat'">
            <i class="bi bi-chat-dots me-2"></i>Chats
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/education'">
            <i class="bi bi-search me-2"></i>Literature Search
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/research'">
            <i class="bi bi-journal-bookmark me-2"></i>Research Notebook
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/transcription'">
            <i class="bi bi-mic me-2"></i>Audio Transcription
          </BDropdownItem>
          <BDropdownDivider />
          <BDropdownItem :to="'/settings'">
            <i class="bi bi-gear me-2"></i>Settings
          </BDropdownItem>
        </BNavItemDropdown>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { BNavbar, BNavbarToggle, BCollapse, BNavbarNav, BNavbarBrand, BNavItemDropdown, BDropdownItem, BDropdownDivider } from "bootstrap-vue-next";
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
