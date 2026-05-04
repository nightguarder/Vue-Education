<script setup lang="ts">
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <footer class="site-footer" role="contentinfo">
    <BContainer>
      <BRow align-v="center">
        <BCol class="text-start">
          <div class="d-flex align-items-center mb-3">
            <img src="/icons/icon-logo-transparent.png" alt="Logo" height="40" class="me-2" />
            <h5 class="mb-0 fw-bold">Vzdělávací platforma</h5>
          </div>
          <p class="mb-1">
            <strong>&copy; {{ currentYear }} Cyril Steger</strong>
          </p>
          <p class="mb-2">Všechna práva vyhrazena.</p>
          <ul class="footer-address-list">
            <li>Na průhonu 540</li>
            <li>29501 Mnichovo Hradiště</li>
            <li>Česká republika</li>
          </ul>
        </BCol>
    <BCol class="text-end">
          <BNav vertical class="footer-nav">
            <BNavItem>
              <RouterLink to="/" class="footer-link" aria-label="Domů">
                Domů
              </RouterLink>
            </BNavItem>
            <BNavItem>
              <RouterLink to="/patients/home" class="footer-link" aria-label="Portál pro pacienty">
                Portál pro pacienty
              </RouterLink>
            </BNavItem>
            <BNavItem>
              <RouterLink to="/doctor/education" class="footer-link" aria-label="Portál pro lékaře">
                Portál pro lékaře
              </RouterLink>
            </BNavItem>
            <BNavItem>
              <RouterLink to="/settings" class="footer-link" aria-label="Nastavení">
                Nastavení
              </RouterLink>
            </BNavItem>
            <BNavItem>
              <RouterLink to="/contact" class="footer-link" aria-label="Kontakt">
                Kontakt
              </RouterLink>
            </BNavItem>
          </BNav>
        </BCol>
      </BRow>
    </BContainer>
  </footer>
</template>

<style scoped lang="scss">
.site-footer {
  background-color: $secondary-color;
  color: #ffffff;
  padding: 1.5rem 0;
  margin-top: auto;
}
.footer-nav {
  list-style: none;
}
.footer-link {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.9rem;
}
.footer-link:hover {
  color: $primary-color;
}
.footer:focus-visible {
  outline: 2px solid $primary-color;
  outline-offset: 4px;
}
.footer-address-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.9;
}
.footer-address-list li {
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.footer-address-list li:last-child {
  border-bottom: none;
}
</style>
