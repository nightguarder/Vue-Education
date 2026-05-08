<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <div class="mb-2">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0 small">
                  <li class="breadcrumb-item"><a href="/">Domů</a></li>
                  <li class="breadcrumb-item"><a href="/patients">Pacient</a></li>
                  <li class="breadcrumb-item active">Dotazník spokojenosti</li>
                </ol>
              </nav>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="card-title mb-1">
                  <i class="bi bi-emoji-smile me-2"></i>Dotazník spokojenosti
                </h4>
                <p class="card-text text-muted mb-0 small">
                  Zpětná vazba ke konzultaci
                </p>
              </div>
              <button class="btn btn-outline-danger btn-sm" @click="showLeaveModal = true">
                <i class="bi bi-box-arrow-left me-1"></i> Opustit
              </button>
            </div>
            <!-- Patient Info -->
            <div class="mt-3 pt-3 border-top">
              <div class="d-flex gap-3 small text-muted">
                <div>
                  <i class="bi bi-person me-1"></i> Pacient: {{ patientName }}
                </div>
                <div>
                  <i class="bi bi-calendar me-1"></i> {{ formatDate(submittedAt) }}
                </div>
              </div>
            </div>
          </div>

          <div class="card-body">
            <!-- Intro -->
            <div class="alert alert-light border mb-4">
              <i class="bi bi-info-circle me-2"></i>
              {{ survey.intro }}
            </div>

            <!-- Survey Fields -->
            <div class="mb-4" v-for="field in survey.fields" :key="field.id">
              <label class="form-label fw-bold">{{ field.label }}</label>
              
              <!-- Textarea -->
              <textarea
                v-if="field.type === 'textarea'"
                v-model="(formData as any)[field.id]"
                class="form-control"
                :rows="(field as any).rows || 3"
                :placeholder="(field as any).placeholder"
              ></textarea>

              <!-- Rating Scale -->
              <div v-else-if="field.type === 'rating'" class="mt-2">
                <div class="d-flex gap-2 justify-content-center">
                  <button
                    v-for="n in (field as any).max"
                    :key="n"
                    class="btn btn-lg p-0 border-0 bg-transparent"
                    @click="(formData as any)[field.id] = n"
                  >
                    <i
                      class="bi"
                      :class="n <= (formData as any)[field.id] ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
                      style="font-size: 2rem"
                    ></i>
                  </button>
                </div>
                <div class="text-center text-muted small mt-1">
                  {{ (field as any).labels ? (field as any).labels[(formData as any)[field.id]] : (formData as any)[field.id] + ' / ' + (field as any).max }}
                </div>
              </div>

              <!-- Yes/No Radio -->
              <div v-else-if="field.type === 'yesno'" class="mt-2 d-flex gap-3">
                <div class="form-check">
                  <input
                    v-model="(formData as any)[field.id]"
                    :value="true"
                    class="form-check-input"
                    type="radio"
                    :id="field.id + '-yes'"
                  />
                  <label class="form-check-label" :for="field.id + '-yes'">
                    <i class="bi bi-hand-thumbs-up text-success me-1"></i> Ano
                  </label>
                </div>
                <div class="form-check">
                  <input
                    v-model="(formData as any)[field.id]"
                    :value="false"
                    class="form-check-input"
                    type="radio"
                    :id="field.id + '-no'"
                  />
                  <label class="form-check-label" :for="field.id + '-no'">
                    <i class="bi bi-hand-thumbs-down text-danger me-1"></i> Ne
                  </label>
                </div>
              </div>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="mt-2">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="(formData as any)[field.id]"
                    :id="field.id"
                  />
                  <label class="form-check-label" :for="field.id">
                    {{ (field as any).checkboxText || 'Ano' }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="d-grid mb-3">
              <button 
                class="btn btn-primary btn-lg" 
                @click="submitSurvey" 
                :disabled="submitting || submitted"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-send me-2"></i>
                {{ submitted ? 'Odesláno!' : 'Odeslat zpětnou vazbu' }}
              </button>
            </div>

            <!-- Success Message -->
            <div v-if="submitted" class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              Děkujeme za vaši zpětnou vazbu!
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave Confirmation Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showLeaveModal }" 
      :style="{ display: showLeaveModal ? 'block' : 'none' }" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Opustit stránku?</h5>
            <button type="button" class="btn-close" @click="showLeaveModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Opravdu chcete opustit? Neuložená odpověď bude ztracena.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showLeaveModal = false">
              Zůstat
            </button>
            <button type="button" class="btn btn-danger" @click="leavePage">
              Opustit
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLeaveModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { patientApi } from '@/services/patientApi'

const survey = reactive({
  title: "Obecná zpětná vazba k sezení",
  type: "obecny_dotaznik",
  intro: "Vaše zpětná vazba nám pomáhá zlepšovat naše služby. Ohodnoťte prosím vaše сеzení. Všechny odpovědi jsou anonymní.",
  fields: [
    {
      id: "q1",
      type: "rating",
      max: 5,
      label: "Jak byste ohodnotili celkovou kvalitu sezení?",
      labels: ['', 'Velmi špatná', 'Špatná', 'Průměrná', 'Dobrá', 'Velmi dobrá']
    },
    {
      id: "q2",
      type: "yesno",
      label: "Cítil/a jste, že vás lékař/ka slyšel/a a porozuměl/a vašim problémům?"
    },
    {
      id: "q3",
      type: "rating",
      max: 5,
      label: "Jak moc vám sezení pomohlo k lepšímu porozumění vašeho stavu?",
      labels: ['', 'Vůbec', 'Trochu', 'Středně', 'Poměrně', 'Velmi']
    },
    {
      id: "q4",
      type: "textarea",
      rows: 2,
      label: "Co byste doporučili ke zlepšení? (nepovinné)",
      placeholder: "Například: více času, jiné téma..."
    },
    {
      id: "q5",
      type: "yesno",
      label: "Doporučil/a byste naše služby dalším lidem?"
    }
  ]
})

const patientId = ref('')
const patientName = ref('Host')
const doctorId = ref('')
const clinicId = ref('')
const sessionId = ref('')
const submittedAt = ref('')
const router = useRouter()
const route = useRoute()

onMounted(() => {
  patientId.value = (route.query.patientId as string) || ''
  patientName.value = (route.query.name as string) || 'Host'
  doctorId.value = (route.query.doctorId as string) || ''
  clinicId.value = (route.query.clinicId as string) || ''
  sessionId.value = (route.query.sessionId as string) || ''
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const formData = reactive({
  q1: 0,
  q2: null,
  q3: 0,
  q4: '',
  q5: null
})

const submitting = ref(false)
const submitted = ref(false)
const showLeaveModal = ref(false)

function formatDate(iso: string): string {
  if (!iso) return new Date().toLocaleDateString('cs-CZ')
  return new Date(iso).toLocaleDateString('cs-CZ')
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (!submitted.value) {
    e.preventDefault()
    e.returnValue = 'Opravdu chcete opustit stránku?'
  }
}

const submitSurvey = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const feedbackData = {
      patientId: patientId.value,
      patientName: patientName.value,
      doctorId: doctorId.value,
      clinicId: clinicId.value,
      sessionId: sessionId.value,
      type: 'general',
      responses: { ...formData },
      submittedAt: new Date().toISOString()
    }

    await patientApi.submitFeedback(feedbackData)

    submittedAt.value = feedbackData.submittedAt
    submitted.value = true
    setTimeout(() => {
      submitted.value = false
    }, 3000)
  } catch (e) {
    console.error('[GeneralSurvey] Submit failed:', e)
    alert('Odeslání se nezdařilo. Zkuste to prosím později.')
  } finally {
    submitting.value = false
  }
}

const leavePage = () => {
  showLeaveModal.value = false
  router.push('/')
}
</script>

<style scoped>
.btn-lg.p-0 {
  transition: transform 0.2s;
}
.btn-lg.p-0:hover {
  transform: scale(1.15);
}
</style>