<template>
  <BNavbar toggleable="lg" type="light" class="site-header" container="lg">
    <BNavbarBrand>
      <RouterLink to="/" class="navbar-brand">Vzdělávací platforma</RouterLink>
    </BNavbarBrand>

    <BNavbarToggle target="navbarNav" />

    <BCollapse id="navbarNav" is-nav class="justify-content-end">
      <BNavbarNav>
        <RouterLink class="nav-link px-3" to="/">Domů</RouterLink>
        <BNavItemDropdown text="Portál pro pacienty">
          <BDropdownItem :to="'/patients/home'">
            <i class="bi bi-house me-2"></i>Přehled
          </BDropdownItem>
          <BDropdownItem :to="'/patients/worksheets'">
            <i class="bi bi-journal-text me-2"></i>Pracovní listy
          </BDropdownItem>
          <BDropdownItem :to="'/patients/infographics'">
            <i class="bi bi-images me-2"></i>Infografiky
          </BDropdownItem>
          <BDropdownItem :to="'/patients/audio'">
            <i class="bi bi-headphones me-2"></i>Audio knihovna
          </BDropdownItem>
          <BDropdownItem :to="'/patients/stress-relief'">
            <i class="bi bi-heart me-2"></i>Zvládání stresu
          </BDropdownItem>
        </BNavItemDropdown>
        <BNavItemDropdown text="Portál pro lékaře">
          <BDropdownItem :to="'/doctor/home'"> <i class="bi bi-house me-2"></i>Domů </BDropdownItem>
          <BDropdownItem :to="'/doctor/chat'">
            <i class="bi bi-chat-dots me-2"></i>Chaty
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/education'">
            <i class="bi bi-search me-2"></i>Vyhledávání literatury
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/research'">
            <i class="bi bi-journal-bookmark me-2"></i>Výzkumný sešit
          </BDropdownItem>
          <BDropdownItem :to="'/doctor/transcription'">
            <i class="bi bi-mic me-2"></i>Přepis audia
          </BDropdownItem>
          <BDropdownDivider />
          <BDropdownItem :to="'/settings'">
            <i class="bi bi-gear me-2"></i>Nastavení
          </BDropdownItem>
        </BNavItemDropdown>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  BNavbar,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavbarBrand,
  BNavItemDropdown,
  BDropdownItem,
  BDropdownDivider,
} from 'bootstrap-vue-next'
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
