<template>
  <div class="patient-home">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          Welcome to the Patient Portal
        </h1>
        <p class="hero-subtitle text-muted lead">
          All your therapeutic materials and tools in one place.
        </p>
      </div>

      <!-- Quick Navigation Buttons Grid -->
      <div class="container-fluid mt-4 px-0">
        <h5 class="text-muted text-center mb-4 fw-bold ps-1">Where to go today?</h5>
        <div class="row g-3">
          <div class="col-12 col-md-4">
            <router-link to="/patients/worksheets" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-journal-text fs-3 text-primary mb-2"></i>
              <span class="fw-bold d-block">Worksheets</span>
              <small class="text-muted">Print your home exercises</small>
            </router-link>
          </div>
          <div class="col-12 col-md-4">
            <router-link to="/patients/worry" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-emoji-laughing fs-3 text-danger mb-2"></i>
              <span class="fw-bold d-block">Emotion Release</span>
              <small class="text-muted">Release anxiety before your session</small>
            </router-link>
          </div>
          <div class="col-12 col-md-4">
            <router-link to="/patients/audio" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-volume-up fs-3 text-success mb-2"></i>
              <span class="fw-bold d-block">Audio Library</span>
              <small class="text-muted">Guided meditations and exercises</small>
            </router-link>
          </div>
          <div class="col-12 col-md-4">
            <router-link to="/patients/feedback" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-star fs-3 text-warning mb-2"></i>
              <span class="fw-bold d-block">Feedback</span>
              <small class="text-muted">Rate your session</small>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.patient-home {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 0;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-content {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f1f1f;
  margin-bottom: 1rem;
}

.nav-card-btn {
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  color: #333;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
    color: #333;
  }
}

.text-primary { color: #2c5282 !important; }
.text-danger { color: #e53e3e !important; }
.text-success { color: #38a169 !important; }
.text-warning { color: #d69e2e !important; }

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
}
</style>
