<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">
              <i class="bi bi-chat-quote me-2"></i>Zpětná vazba k platformě
            </h4>
            <p class="card-text text-muted mb-0 small">
              Podělte se o své zkušenosti z používání naší platformy.
            </p>
          </div>
          <div class="card-body">
            <!-- Patient ID Input -->
            <div class="mb-4">
              <label class="form-label fw-bold">ID pacienta: (nepovinné)</label>
              <div class="input-group">
                <input
                  v-model="patientId"
                  type="text"
                  class="form-control"
                  placeholder="Zadejte své ID pacienta pro personalizované sledování"
                />
                <button class="btn btn-outline-secondary" @click="patientId = ''" title="Vymazat">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="form-text">Ponechte prázdné pro anonymní zpětnou vazbu</div>
            </div>

            <!-- Session Type -->
            <div class="mb-4">
              <label class="form-label fw-bold">Typ modulu:</label>
              <select v-model="moduleType" class="form-select">
                <option value="">Vyberte typ modulu...</option>
                <option value="worksheet">Pracovní list</option>
                <option value="audio">Audio / Podcast</option>
                <option value="resource">Infografika / Zdroj</option>
                <option value="stress">Cvičení na uvolnění stresu</option>
                <option value="other">Jiné</option>
              </select>
            </div>

            <!-- Rating -->
            <div class="mb-4">
              <label class="form-label fw-bold">Jak moc se Vám tento modul líbil?</label>
              <div class="d-flex gap-3 justify-content-center mt-2">
                <button
                  v-for="star in 5"
                  :key="star"
                  class="btn btn-lg p-0 border-0 bg-transparent"
                  @click="rating = star"
                >
                  <i
                    class="bi"
                    :class="star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
                    style="font-size: 2rem"
                  ></i>
                </button>
              </div>
              <div class="text-center text-muted small mt-1">
                {{ ratingLabels[rating] || 'Klikněte pro hodnocení' }}
              </div>
            </div>

            <!-- Difficulty -->
            <div class="mb-4">
              <label class="form-label fw-bold">Úroveň obtížnosti:</label>
              <div class="d-flex gap-2 justify-content-center mt-2">
                <button
                  v-for="level in difficultyLevels"
                  :key="level.value"
                  class="btn"
                  :class="difficulty === level.value ? 'btn-primary' : 'btn-outline-primary'"
                  @click="difficulty = level.value"
                >
                  {{ level.label }}
                </button>
              </div>
            </div>

            <!-- Comments -->
            <div class="mb-4">
              <label class="form-label fw-bold">Komentář: (nepovinné)</label>
              <textarea
                v-model="comments"
                class="form-control"
                rows="4"
                placeholder="Co vám bylo nejužitečnější? Jaké máte návrhy na zlepšení?"
              ></textarea>
            </div>

            <!-- Would Recommend -->
            <div class="mb-4">
              <label class="form-label fw-bold">Doporučili byste toto ostatním?</label>
              <div class="d-flex gap-3">
                <div class="form-check">
                  <input
                    v-model="wouldRecommend"
                    :value="true"
                    class="form-check-input"
                    type="radio"
                    id="recommend-yes"
                  />
                  <label class="form-check-label" for="recommend-yes">
                    <i class="bi bi-hand-thumbs-up text-success me-1"></i> Ano
                  </label>
                </div>
                <div class="form-check">
                  <input
                    v-model="wouldRecommend"
                    :value="false"
                    class="form-check-input"
                    type="radio"
                    id="recommend-no"
                  />
                  <label class="form-check-label" for="recommend-no">
                    <i class="bi bi-hand-thumbs-down text-danger me-1"></i> Ne
                  </label>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="d-grid">
              <button
                class="btn btn-primary btn-lg"
                @click="submitFeedback"
                :disabled="submitting || rating === 0 || !moduleType"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-send me-2"></i>
                {{ submitted ? 'Odesláno!' : 'Odeslat zpětnou vazbu' }}
              </button>
            </div>

            <!-- Success Message -->
            <div v-if="submitted" class="alert alert-success mt-3">
              <i class="bi bi-check-circle me-2"></i>
              Děkujeme za vaši zpětnou vazbu! Vaše odpověď nám pomáhá se zlepšovat.
            </div>
          </div>
        </div>

        <!-- Previous Feedback History (for patient with ID) -->
        <div v-if="patientId && feedbackHistory.length > 0" class="card shadow-sm border-0 mt-4">
          <div class="card-header bg-white border-bottom">
            <h5 class="card-title mb-0">
              <i class="bi bi-clock-history me-2"></i>Vaše předchozí zpětná vazba
            </h5>
          </div>
          <div class="card-body">
            <div
              v-for="(item, index) in feedbackHistory"
              :key="index"
              class="border-bottom pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <span class="badge bg-light text-dark border">{{ item.moduleType }}</span>
                  <span class="ms-2 text-warning">
                    <i v-for="star in item.rating" :key="star" class="bi bi-star-fill small"></i>
                  </span>
                </div>
                <small class="text-muted">{{ formatDate(item.timestamp) }}</small>
              </div>
              <p v-if="item.comments" class="small text-muted mt-1 mb-0">
                {{ truncate(item.comments, 100) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface FeedbackEntry {
  patientId?: string
  moduleType: string
  rating: number
  difficulty: string
  comments: string
  wouldRecommend: boolean
  timestamp: string
}

// State
const patientId = ref('')
const moduleType = ref('')
const rating = ref(0)
const difficulty = ref('')
const comments = ref('')
const wouldRecommend = ref<boolean | null>(null)
const submitting = ref(false)
const submitted = ref(false)
const feedbackHistory = ref<FeedbackEntry[]>([])

const ratingLabels: Record<number, string> = {
  1: 'Vůbec nepomohlo',
  2: 'Trochu pomohlo',
  3: 'Pomohlo',
  4: 'Velmi pomohlo',
  5: 'Mimořádně pomohlo',
}

const difficultyLevels = [
  { value: 'too-easy', label: 'Příliš lehké' },
  { value: 'just-right', label: 'Akorát' },
  { value: 'challenging', label: 'Náročné' },
  { value: 'too-hard', label: 'Příliš těžké' },
]

// Load history when patient ID changes
watch(patientId, (newId) => {
  if (newId) {
    loadFeedbackHistory(newId)
  } else {
    feedbackHistory.value = []
  }
})

function loadFeedbackHistory(id: string) {
  try {
    const allFeedback = JSON.parse(
      localStorage.getItem('patientFeedback') || '[]',
    ) as FeedbackEntry[]
    feedbackHistory.value = allFeedback
      .filter((f) => f.patientId === id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch {
    feedbackHistory.value = []
  }
}

async function submitFeedback() {
  if (rating.value === 0 || !moduleType.value) return

  submitting.value = true

  try {
    const entry: FeedbackEntry = {
      patientId: patientId.value || undefined,
      moduleType: moduleType.value,
      rating: rating.value,
      difficulty: difficulty.value,
      comments: comments.value,
      wouldRecommend: wouldRecommend.value ?? true,
      timestamp: new Date().toISOString(),
    }

    // Save to localStorage (TODO: replace with MySQL API)
    const allFeedback = JSON.parse(
      localStorage.getItem('patientFeedback') || '[]',
    ) as FeedbackEntry[]
    allFeedback.push(entry)
    localStorage.setItem('patientFeedback', JSON.stringify(allFeedback))

    // Update history if patient ID provided
    if (patientId.value) {
      loadFeedbackHistory(patientId.value)
    }

    // Reset form
    submitted.value = true
    moduleType.value = ''
    rating.value = 0
    difficulty.value = ''
    comments.value = ''
    wouldRecommend.value = null

    // Reset submitted state after delay
    setTimeout(() => {
      submitted.value = false
    }, 3000)
  } catch (err: any) {
    console.error('[PatientFeedback] Submit error:', err)
  } finally {
    submitting.value = false
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.btn-lg.p-0 {
  transition: transform 0.2s;
}
.btn-lg.p-0:hover {
  transform: scale(1.2);
}
</style>
