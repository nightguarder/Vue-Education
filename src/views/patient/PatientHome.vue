<template>
  <div class="patient-home">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Vítejte v pacientském portálu</h1>
        <p class="hero-subtitle text-muted lead">
          Všechny vaše terapeutické materiály a nástroje na jednom místě.
        </p>
      </div>

      <!-- Progressive Daily Quote Card -->
      <div class="container-fluid px-0 mb-5">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden quote-card">
          <div class="card-body p-4 text-center position-relative">
            <h6 class="text-primary fw-bold text-uppercase mb-3">
              <i class="bi bi-brightness-high me-2"></i>Myšlenka pro dnešní den
            </h6>

            <div
              class="quote-content position-relative"
              style="min-height: 80px; display: flex; align-items: center; justify-content: center"
            >
              <p
                class="fs-5 fst-italic text-dark mb-0 quote-text"
                :class="{ 'fade-in': isAiQuote }"
              >
                "{{ currentQuote }}"
              </p>
            </div>

            <div class="mt-3 d-flex justify-content-center align-items-center">
              <div
                v-if="isAiQuote"
                class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fade-in"
              >
                <i class="bi bi-stars me-1"></i> Local AI ready ✨
              </div>
              <div v-else-if="isDownloading" class="text-muted small">
                <span
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Probouzím umělou inteligenci... {{ Math.round(downloadProgress) }}%
              </div>
              <div
                v-else-if="!downloadAllowed"
                class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-2"
                title="Data Saver Mode / Offline"
              >
                <i class="bi bi-cloud-slash me-1"></i> Režim úspory dat
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Navigation Buttons Grid -->
      <div class="container-fluid mt-4 px-0">
        <h5 class="text-muted text-center mb-4 fw-bold ps-1">Kam se dnes vydáte?</h5>
        <div class="row g-3">
          <div class="col-12 col-md-6 col-lg-4">
            <router-link
              to="/patients/worksheets"
              class="nav-card-btn h-100 d-block text-decoration-none"
            >
              <i class="bi bi-journal-text fs-3 text-primary mb-2"></i>
              <span class="fw-bold d-block">Pracovní listy</span>
              <small class="text-muted">Vytiskněte si svá domácí cvičení</small>
            </router-link>
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <router-link
              to="/patients/infographics"
              class="nav-card-btn h-100 d-block text-decoration-none"
            >
              <i class="bi bi-file-earmark-image fs-3 infographic-icon mb-2"></i>
              <span class="fw-bold d-block">Infografiky</span>
              <small class="text-muted">Vzdělávací materiály DIN A4</small>
            </router-link>
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <router-link
              to="/patients/stress-relief"
              class="nav-card-btn h-100 d-block text-decoration-none"
            >
              <i class="bi bi-emoji-laughing fs-3 text-danger mb-2"></i>
              <span class="fw-bold d-block">Uvolnění emocí</span>
              <small class="text-muted">Uvolněte úzkost před sezením</small>
            </router-link>
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <router-link
              to="/patients/audio"
              class="nav-card-btn h-100 d-block text-decoration-none"
            >
              <i class="bi bi-volume-up fs-3 text-success mb-2"></i>
              <span class="fw-bold d-block">Audio knihovna</span>
              <small class="text-muted">Vedené meditace a cvičení</small>
            </router-link>
          </div>
          <div class="col-12 col-md-6 col-lg-4">
            <router-link
              to="/patients/feedback"
              class="nav-card-btn h-100 d-block text-decoration-none"
            >
              <i class="bi bi-star fs-3 text-warning mb-2"></i>
              <span class="fw-bold d-block">Zpětná vazba</span>
              <small class="text-muted">Ohodnoťte své sezení</small>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStressReliefAI } from '../../composables/useStressReliefAI'

const { generateDailyQuote, getRandomQuote, isDownloadAllowed, isDownloading, downloadProgress } =
  useStressReliefAI()

const currentQuote = ref('')
const isAiQuote = ref(false)
const downloadAllowed = ref(true)

onMounted(async () => {
  // Phase 1: Set immediate fallback
  currentQuote.value = getRandomQuote()

  // Phase 2: Check cache
  const today = new Date().toDateString()
  const cachedQuote = localStorage.getItem('daily_quote')
  const cachedDate = localStorage.getItem('daily_quote_date')
  const cachedType = localStorage.getItem('daily_quote_type')

  if (cachedDate === today && cachedQuote) {
    currentQuote.value = cachedQuote
    isAiQuote.value = cachedType === 'ai'
    return // We have today's quote, don't generate a new one
  }

  // Phase 3: Evaluate network & upgrade
  downloadAllowed.value = isDownloadAllowed()
  if (!downloadAllowed.value) {
    // Stick with fallback
    return
  }

  // Automatic model loading removed - quote generation requires manual trigger
  console.log('[Home] Skipping automatic AI model load')
})
</script>

<style scoped lang="scss">
.patient-home {
  max-width: 1000px;
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
    border-color: $primary-color;
    color: #333;
  }
}

.infographic-icon {
  color: $secondary-color;
}

.text-primary {
  color: $primary-color !important;
}
.text-danger {
  color: #e53e3e !important;
}
.text-success {
  color: #38a169 !important;
}
.text-warning {
  color: #d69e2e !important;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
}

.quote-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.quote-text {
  transition: opacity 0.5s ease-in-out;
}

.fade-in {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
