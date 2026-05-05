<script setup lang="ts"></script>

<template>
  <main class="education-page">
    <!-- Hero Section -->
    <section class="hero-section py-5">
      <BContainer>
        <BRow class="justify-content-center">
          <BCol lg="8" class="text-center">
            <h1 class="h1 mb-4">Vzdělávací platforma</h1>
            <p class="lead text-muted mb-0">
              Zdroje, materiály a nástroje pro vzdělávání v oblasti duševního zdraví.
            </p>
          </BCol>
        </BRow>
      </BContainer>
    </section>

    <!-- Portal Selection Section -->
    <section class="portals-section py-5">
      <BContainer>
        <BRow class="g-4 justify-content-center">
          <!-- Doctors Portal Card -->
          <BCol md="6" lg="5">
            <BCard
              class="portal-card h-100 p-2 bg-white border-0 shadow-sm"
              @click="$router.push('/doctor/education')"
            >
              <div class="d-flex align-items-start mb-3">
                <div class="portal-icon-wrapper me-3">
                  <i class="bi bi-clipboard2-pulse fs-2 text-primary"></i>
                </div>
                <div class="flex-grow-1">
                  <h3 class="h4 mb-2">Portál pro lékaře</h3>
                  <BBadge variant="light" class="text-dark border"> Vyžaduje přihlášení </BBadge>
                </div>
              </div>
              <p class="text-muted mb-3">
                Odborné materiály pro psychology, psychiatry a pediatry. Klinické případy, metodiky
                a výzkumné studie.
              </p>
              <div class="feature-list mb-3">
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-primary me-2"></i>
                  <small>Klinické případy a kazuistiky</small>
                </div>
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-primary me-2"></i>
                  <small>Metodické postupy</small>
                </div>
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-primary me-2"></i>
                  <small>Výzkumné studie a publikace</small>
                </div>
              </div>
              <div class="d-flex align-items-center text-primary fw-bold">
                <span>Přihlásit se</span>
                <i class="bi bi-arrow-right ms-2"></i>
              </div>
            </BCard>
          </BCol>

          <!-- Patients Portal Card -->
          <BCol md="6" lg="5">
            <BCard
              class="portal-card h-100 p-2 bg-white border-0 shadow-sm"
              @click="$router.push('/patients/home')"
            >
              <div class="d-flex align-items-start mb-3">
                <div class="portal-icon-wrapper me-3 icon-success">
                  <i class="bi bi-heart-pulse fs-2 text-success"></i>
                </div>
                <div class="flex-grow-1">
                  <h3 class="h4 mb-2">Portál pro pacienty</h3>
                  <BBadge variant="success" class="bg-opacity-10 text-success">
                    Volný přístup
                  </BBadge>
                </div>
              </div>
              <p class="text-muted mb-3">
                Dostupné materiály pro pacienty a jejich rodiny. Články, videa, podcasty a
                interaktivní cvičení.
              </p>
              <div class="feature-list mb-3">
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <small>Vzdělávací články</small>
                </div>
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <small>Videa a podcasty</small>
                </div>
                <div class="feature-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <small>Interaktivní cvičení</small>
                </div>
              </div>
              <div class="d-flex align-items-center text-success fw-bold">
                <span>Procházet obsah</span>
                <i class="bi bi-arrow-right ms-2"></i>
              </div>
            </BCard>
          </BCol>
        </BRow>
      </BContainer>
    </section>

    <!-- Info Section -->
    <section class="info-section py-5">
      <BContainer>
        <BRow class="g-4">
          <BCol md="4" class="text-center">
            <div class="info-icon mb-3">
              <i class="bi bi-mortarboard-fill fs-1 text-primary"></i>
            </div>
            <h4 class="h5 mb-2">Odborný obsah</h4>
            <p class="text-muted small">
              Materiály připravené zkušenými odborníky na duševní zdraví
            </p>
          </BCol>
          <BCol md="4" class="text-center">
            <div class="info-icon mb-3">
              <i class="bi bi-globe fs-1 text-primary"></i>
            </div>
            <h4 class="h5 mb-2">Více jazyků</h4>
            <p class="text-muted small">Obsah dostupný v češtině a angličtině</p>
          </BCol>
          <BCol md="4" class="text-center">
            <div class="info-icon mb-3">
              <i class="bi bi-phone fs-1 text-primary"></i>
            </div>
            <h4 class="h5 mb-2">Mobilní přístup</h4>
            <p class="text-muted small">Přístup z počítače, tabletu nebo mobilního telefonu</p>
          </BCol>
        </BRow>
      </BContainer>
    </section>

    <!-- Contact CTA -->
    <section class="cta-section py-4">
      <BContainer class="text-center">
        <p class="mb-0 text-muted">
          Máte dotazy?
          <RouterLink to="/contact" class="text-primary">Kontaktujte nás</RouterLink> pro více
          informací.
        </p>
      </BContainer>
    </section>
  </main>
</template>

<style scoped lang="scss">
.hero-section {
  background-color: #ffffff;
}

.portal-card {
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
  }
}

.text-primary {
  color: $primary-color !important;
}

.text-success {
  color: $secondary-color !important;
}

.portal-icon-wrapper {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($primary-color, 0.1);
  border-radius: 12px;

  &.icon-success {
    background-color: rgba($secondary-color, 0.1);
  }
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
}

.info-section {
  background-color: #ffffff;
}

.info-icon {
  color: $primary-color;
}

.cta-section {
  background-color: #f8f9fa;
  border-top: 1px solid #e2e8f0;
}
</style>
