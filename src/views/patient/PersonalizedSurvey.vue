<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h4 class="card-title mb-1">
                  <i class="bi bi-clipboard2-pulse me-2"></i>{{ survey.title }}
                </h4>
                <p class="card-text text-muted mb-0 small">
                  Personalizovaný pracovní list
                </p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary btn-sm" @click="showQRModal = true">
                  <i class="bi bi-qr-code me-1"></i> QR Kód
                </button>
                <button class="btn btn-outline-danger btn-sm" @click="showLeaveModal = true">
                  <i class="bi bi-box-arrow-left me-1"></i> Opustit
                </button>
              </div>
            </div>
            <!-- Patient Info -->
            <div class="mt-3 pt-3 border-top">
              <div class="d-flex gap-3 small text-muted">
                <div>
                  <i class="bi bi-person me-1"></i> Pacient: {{ patientName }}
                </div>
                <div>
                  <i class="bi bi-id-card me-1"></i> ID: {{ patientId }}
                </div>
              </div>
            </div>
          </div>

          <div class="card-body">
            <!-- Intro -->
            <div class="alert alert-info border-0 mb-4">
              {{ survey.intro }}
            </div>

            <!-- Survey Fields -->
            <div class="mb-4" v-for="field in survey.fields" :key="field.id">
              <label class="form-label fw-bold">{{ field.label }}</label>
              
              <!-- Textarea -->
              <textarea
                v-if="field.type === 'textarea'"
                v-model="formData[field.id]"
                class="form-control"
                rows="3"
                :placeholder="field.placeholder"
              ></textarea>

              <!-- Slider -->
              <div v-else-if="field.type === 'slider'" class="mt-2">
                <input
                  type="range"
                  class="form-range"
                  :min="field.min"
                  :max="field.max"
                  v-model.number="formData[field.id]"
                  :id="field.id"
                />
                <div class="d-flex justify-content-between text-muted small mt-1">
                  <span>{{ field.min }} (Úplný klid)</span>
                  <span class="fw-bold text-primary">{{ formData[field.id] }}</span>
                  <span>{{ field.max }} (Naprostá neschopnost)</span>
                </div>
              </div>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="mt-2">
                <div class="form-label fw-bold mb-2">{{ field.label }}</div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="formData[field.id]"
                    :id="field.id"
                  />
                  <label class="form-check-label" :for="field.id">
                    {{ field.checkboxText || 'Ano' }}
                  </label>
                </div>
                <div v-if="field.description" class="form-text text-muted small mt-1">
                  {{ field.description }}
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
                {{ submitted ? 'Odesláno!' : 'Odeslat pracovní list' }}
              </button>
            </div>

            <!-- Success Message -->
            <div v-if="submitted" class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              Děkujeme za vyplnění pracovního listu! Vaše odpovědi byly uloženy.
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
            <p>Opravdu chcete opustit tuto stránku? Veškerý neuložený postup bude ztracen.</p>
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

    <!-- QR Code Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showQRModal }" 
      :style="{ display: showQRModal ? 'block' : 'none' }" 
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">QR Kód pro anketu</h5>
            <button type="button" class="btn-close" @click="showQRModal = false"></button>
          </div>
          <div class="modal-body text-center">
            <p class="small text-muted mb-3">Naskenujte kód pro otevření ankety</p>
            <QRCode :value="surveyUrl" :size="200" class="mx-auto" />
            <p class="small text-muted mt-3 mb-0">ID pacienta: {{ patientId }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showQRModal = false">
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLeaveModal || showQRModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import QRCode from 'qrcode.vue'
import { patientApi } from '@/services/patientApi'

// Fake survey data (provided)
const survey = reactive({
  title: "První krok k obnově energie: Plán pro zvládání vnitřní prázdnoty",
  type: "interaktivní_pracovní_list",
  intro: "Vážený pane Veselý, chci, abyste věděl, že to, co prožíváte – ten pocit prázdnoty a neustálého napětí – je přirozená reakce organismu na dlouhodobé vyčerpání. Tento pracovní list není o tom, abyste se jen 'udržel', ale abychom společně lépe pochopili strach, který se u vás ozývá v noci, a našli způsob, jak vám vrátit pocit kontroly nad vaším dnem.",
  fields: [
    {
      id: "q1",
      type: "textarea",
      label: "Popište situaci z posledních dní, kdy jste pociťoval tlak na hrudi nebo úzkost (např. při práci, po probuzení). Co vám běželo hlavou?",
      placeholder: "Např.: 'Ráno po probuzení jsem cítil...'"
    },
    {
      id: "q2",
      type: "slider",
      min: 0,
      max: 10,
      label: "Intenzita vnitřní prázdnoty a odtržení od reality (0 = klid, 10 = neschopnost vnímat okolí)"
    },
    {
      id: "q3",
      type: "checkbox",
      label: "Mikro-aktivace: Dnes jsem se rozhodl pro jednu malou činnost, abych předešel pocitu neschopnosti.",
      checkboxText: "Ano",
      description: "Například: jít na procházku, být hodinu bez telefonu, napsat krátký e-mail."
    },
    {
      id: "q4",
      type: "textarea",
      label: "Když vás v noci probudí nevysvětlitelný strach, napište jednu věc, která je teď v bezpečí (např. váš domov), aby se myšlenky nezaměřily na katastrofické scénáře.",
      placeholder: "Zde si zapište jednu věc která vás napadne..."
    }
  ]
})

// Patient data
const patientId = ref('')
const patientName = ref('Jan Veselý')
const doctorId = ref('')
const clinicId = ref('')
const sessionId = ref('')
const router = useRouter()
const route = useRoute()
const surveyUrl = ref('')
const showQRModal = ref(false)

// Generate random patient ID on mount
onMounted(() => {
  patientId.value = (route.query.patientId as string) || ''
  patientName.value = (route.query.name as string) || 'Jan Veselý'
  doctorId.value = (route.query.doctorId as string) || ''
  clinicId.value = (route.query.clinicId as string) || ''
  sessionId.value = (route.query.sessionId as string) || ''

  surveyUrl.value = `${window.location.origin}/#/patients/survey/personalized?patientId=${patientId.value}&doctorId=${doctorId.value}&clinicId=${clinicId.value}&sessionId=${sessionId.value}`
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// Form state
const formData = reactive({
  q1: '',
  q2: 0,
  q3: false,
  q4: ''
})

const submitting = ref(false)
const submitted = ref(false)
const showLeaveModal = ref(false)

// Methods
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!submitted.value) {
    e.preventDefault()
    e.returnValue = 'Opravdu chcete opustit stránku? K dotazníku se můžete kdykoliv vrátit přes odkaz.'
  }
}

const submitSurvey = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const surveyData = {
      patientId: patientId.value,
      patientName: patientName.value,
      doctorId: doctorId.value,
      clinicId: clinicId.value,
      sessionId: sessionId.value,
      type: 'personalized',
      aiContext: { intro: survey.intro }, // Example context
      responses: { ...formData },
      submittedAt: new Date().toISOString()
    }

    await patientApi.submitPersonalizedSurvey(surveyData)

    submitted.value = true
    setTimeout(() => {
      submitted.value = false
    }, 3000)
  } catch (e) {
    console.error('[PersonalizedSurvey] Submit failed:', e)
    alert('Odeslání se nezdařilo. Zkuste to prosím později.')
  } finally {
    submitting.value = false
  }
}

const leavePage = () => {
  showLeaveModal.value = false
  router.push('/') // Adjust to your home route
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
