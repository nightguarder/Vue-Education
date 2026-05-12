<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStressReliefAI } from '@/composables/useStressReliefAI'

const { getRandomQuote, isDownloadAllowed, isDownloading, downloadProgress } = useStressReliefAI()

const totalSessions = ref(0)
const totalPatients = ref(0)
const totalBlogPosts = ref(0)
const isLoading = ref(true)

const currentQuote = ref('')
const isAiQuote = ref(false)
const downloadAllowed = ref(true)

onMounted(() => {
  // Stats from localStorage (no backend required)
  const chats = JSON.parse(localStorage.getItem('doctor_chats') || '[]')
  const patients = JSON.parse(localStorage.getItem('doctor_patients') || '[]')
  const blogPosts = JSON.parse(localStorage.getItem('published_blog_posts') || '[]')

  totalSessions.value = chats.length
  totalPatients.value = patients.length
  totalBlogPosts.value = blogPosts.length
  isLoading.value = false

  // Quote Logic
  currentQuote.value = getRandomQuote()
  const today = new Date().toDateString()
  const cachedQuote = localStorage.getItem('daily_quote')
  const cachedDate = localStorage.getItem('daily_quote_date')
  const cachedType = localStorage.getItem('daily_quote_type')

  if (cachedDate === today && cachedQuote) {
    currentQuote.value = cachedQuote
    isAiQuote.value = cachedType === 'ai'
  }
  
  downloadAllowed.value = isDownloadAllowed()
})
</script>

<template>
  <div class="landing-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Lékařský pracovní prostor</h1>
        <p class="hero-subtitle text-muted lead">
          Integrované nástroje pro moderní klinickou praxi a výzkum.
        </p>
      </div>

      <!-- Daily Quote Card -->
      <div class="container-fluid px-0 mb-4">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden quote-card">
          <div class="card-body p-4 text-center position-relative">
            <h6 class="text-primary fw-bold text-uppercase mb-3">
              <i class="bi bi-brightness-high me-2"></i>Myšlenka pro dnešní den
            </h6>
            <div class="quote-content position-relative" style="min-height: 60px; display: flex; align-items: center; justify-content: center">
              <p class="fs-5 fst-italic text-dark mb-0 quote-text" :class="{ 'fade-in': isAiQuote }">
                "{{ currentQuote }}"
              </p>
            </div>
            <div class="mt-3 d-flex justify-content-center align-items-center">
              <div v-if="isAiQuote" class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fade-in">
                <i class="bi bi-stars me-1"></i> Local AI ready ✨
              </div>
              <div v-else-if="isDownloading" class="text-muted small">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Probouzím umělou inteligenci... {{ Math.round(downloadProgress) }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="container-fluid px-0 mb-5">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden stats-card">
          <div class="card-body p-3">
            <div class="row text-center g-2">
              <div class="col-4">
                <h5 class="fw-bold text-primary mb-0">{{ isLoading ? '-' : totalSessions }}</h5>
                <small class="text-muted extra-small">Klinických chatů</small>
              </div>
              <div class="col-4">
                <h5 class="fw-bold text-success mb-0">{{ isLoading ? '-' : totalPatients }}</h5>
                <small class="text-muted extra-small">Evidovaných pacientů</small>
              </div>
              <div class="col-4">
                <h5 class="fw-bold text-warning mb-0">{{ isLoading ? '-' : totalBlogPosts }}</h5>
                <small class="text-muted extra-small">Publikovaných blogů</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Professional Tools Grid -->
      <div class="container-fluid mt-2 px-0">
        <h5 class="text-muted text-center mb-4 fw-bold ps-1">Pracovní nástroje</h5>
        <div class="row g-3">
          <!-- Tool 1: Chat -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/doctor/chat" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-chat-dots fs-3 text-primary mb-2"></i>
              <span class="fw-bold d-block">Lékařský Chat</span>
              <small class="text-muted">Klinický dialog a analýza sezení</small>
            </router-link>
          </div>
          
          <!-- Tool 2: Medical Researcher -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/doctor/research" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-robot fs-3 text-success mb-2"></i>
              <span class="fw-bold d-block">Medical Researcher</span>
              <small class="text-muted">PubMed syntéza a Deep Dive blogy</small>
            </router-link>
          </div>

          <!-- Tool 3: Transcription -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/doctor/transcription" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-mic fs-3 text-danger mb-2"></i>
              <span class="fw-bold d-block">Přepis konzultací</span>
              <small class="text-muted">Převod audia na strukturovaný text</small>
            </router-link>
          </div>

          <!-- Tool 4: Patient Management (Combined with Worksheets) -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/doctor/patients" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-person-lines-fill fs-3 text-info mb-2"></i>
              <span class="fw-bold d-block">Správa pacientů</span>
              <small class="text-muted">Evidence a pracovní listy</small>
            </router-link>
          </div>

          <!-- Tool 5: Calendar -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/doctor/calendar" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-calendar-check fs-3 text-warning mb-2"></i>
              <span class="fw-bold d-block">Kalendář</span>
              <small class="text-muted">Plánování termínů a sezení</small>
            </router-link>
          </div>

          <!-- Tool 6: Settings -->
          <div class="col-12 col-md-6 col-lg-4">
            <router-link to="/settings" class="nav-card-btn h-100 d-block text-decoration-none">
              <i class="bi bi-gear fs-3 text-secondary mb-2"></i>
              <span class="fw-bold d-block">Nastavení</span>
              <small class="text-muted">Konfigurace AI modelů a API</small>
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.landing-page {
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
  color: #1e293b;
  margin-bottom: 1rem;
}

.nav-card-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  color: #334155;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: var(--bs-primary);
    color: #0f172a;
  }
}

.text-primary { color: #3b82f6 !important; }
.text-success { color: #10b981 !important; }
.text-danger { color: #ef4444 !important; }
.text-warning { color: #f59e0b !important; }
.text-info { color: #06b6d4 !important; }

.quote-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0 !important;
}

.stats-card {
  background: white;
  border: 1px solid #f1f5f9 !important;
}

.extra-small {
  font-size: 0.75rem;
  font-weight: 500;
}

.fade-in {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .hero-title { font-size: 2rem; }
}
</style>