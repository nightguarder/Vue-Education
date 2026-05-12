<template>
  <div class="patients-view container-fluid py-4">
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="fw-bold text-primary mb-1">
          <i class="bi bi-person-lines-fill me-2"></i>Správa pacientů a materiálů
        </h2>
        <p class="text-muted">Evidence pacientů, historie sezení a správa pracovních listů.</p>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left: Patient List -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
          <div class="card-header bg-white py-3 border-bottom-0">
            <div class="input-group rounded-pill overflow-hidden border">
              <span class="input-group-text bg-white border-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model="searchQuery" type="text" class="form-control border-0" placeholder="Hledat pacienta...">
              <button class="btn btn-primary" @click="showAddPatientModal = true">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <button 
                v-for="patient in filteredPatients" 
                :key="patient.id"
                class="list-group-item list-group-item-action border-0 py-3 px-4 d-flex align-items-center gap-3"
                :class="{ 'active-patient bg-primary bg-opacity-10 border-start border-4 border-primary': selectedPatient?.id === patient.id }"
                @click="selectedPatient = patient"
              >
                <div class="avatar bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold" style="width: 40px; height: 40px;">
                  {{ patient.name.charAt(0) }}
                </div>
                <div class="flex-grow-1">
                  <div class="fw-bold text-dark">{{ patient.name }}</div>
                  <small class="text-muted">{{ patient.age }} let • {{ patient.gender }}</small>
                </div>
                <i class="bi bi-chevron-right text-muted small"></i>
              </button>
            </div>
            <div v-if="filteredPatients.length === 0" class="text-center py-5">
              <i class="bi bi-people text-muted display-4 opacity-25"></i>
              <p class="text-muted mt-2">Žádní pacienti nenalezeni</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Patient Detail & Worksheets -->
      <div class="col-lg-8">
        <div v-if="selectedPatient" class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
          <div class="card-header bg-white py-4 px-4 border-bottom d-flex align-items-center justify-content-between">
            <div>
              <h3 class="fw-bold mb-1 text-dark">{{ selectedPatient.name }}</h3>
              <p class="text-muted mb-0">ID: {{ selectedPatient.id }} • {{ selectedPatient.email }}</p>
            </div>
            <div class="btn-group rounded-pill overflow-hidden border">
              <button class="btn btn-outline-primary px-4 py-2" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Informace</button>
              <button class="btn btn-outline-primary px-4 py-2" :class="{ active: activeTab === 'worksheets' }" @click="activeTab = 'worksheets'">Pracovní listy</button>
              <button class="btn btn-outline-primary px-4 py-2" :class="{ active: activeTab === 'surveys' }" @click="activeTab = 'surveys'">Průzkumy</button>
            </div>
          </div>

          <div class="card-body p-4 overflow-auto" style="max-height: 700px;">
            <!-- Tab: Info -->
            <div v-if="activeTab === 'info'" class="fade-in">
              <div class="row g-4">
                <div class="col-md-6">
                  <h6 class="fw-bold text-muted text-uppercase small mb-3">Základní údaje</h6>
                  <div class="p-3 bg-light rounded-4 mb-3">
                    <div class="mb-2"><span class="text-muted small">Věk:</span> <span class="fw-bold ms-2">{{ selectedPatient.age }} let</span></div>
                    <div class="mb-2"><span class="text-muted small">Pohlaví:</span> <span class="fw-bold ms-2">{{ selectedPatient.gender }}</span></div>
                    <div><span class="text-muted small">Kontakt:</span> <span class="fw-bold ms-2">{{ selectedPatient.phone || 'N/A' }}</span></div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="fw-bold text-muted text-uppercase small mb-3">Diagnóza / Poznámky</h6>
                  <div class="p-3 bg-light rounded-4 h-100">
                    <p class="mb-0 text-dark" style="white-space: pre-wrap;">{{ selectedPatient.notes || 'Žádné poznámky.' }}</p>
                  </div>
                </div>
              </div>

              <h6 class="fw-bold text-muted text-uppercase small mb-3 mt-5">Historie sezení</h6>
              <div class="table-responsive">
                <table class="table table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th class="border-0 rounded-start">Datum</th>
                      <th class="border-0">Typ</th>
                      <th class="border-0">Stav</th>
                      <th class="border-0 rounded-end">Akce</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="session in patientSessions" :key="session.id">
                      <td class="fw-bold">{{ formatDate(session.created_at) }}</td>
                      <td><span class="badge bg-info bg-opacity-10 text-info rounded-pill px-3">{{ session.type || 'Konzultace' }}</span></td>
                      <td><span class="badge" :class="statusClass(session.status)">{{ session.status }}</span></td>
                      <td><button class="btn btn-sm btn-outline-primary rounded-pill px-3" @click="viewSession(session)">Detail</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Tab: Worksheets -->
            <div v-if="activeTab === 'worksheets'" class="fade-in">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold mb-0">Přiřazené materiály</h5>
                <button class="btn btn-primary rounded-pill px-4" @click="openCreateWorksheet">
                  <i class="bi bi-plus-lg me-2"></i>Nový pracovní list
                </button>
              </div>

              <div class="row g-3">
                <div v-for="ws in patientWorksheets" :key="ws.id" class="col-md-6">
                  <div class="card border bg-light rounded-4 h-100">
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-bold text-primary mb-0">{{ ws.title }}</h6>
                        <span class="badge rounded-pill" :class="ws.completed ? 'bg-success' : 'bg-warning text-dark'">
                          {{ ws.completed ? 'Hotovo' : 'Čeká' }}
                        </span>
                      </div>
                      <p class="text-muted small mb-3">{{ truncate(ws.description, 80) }}</p>
                      <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-white border rounded-pill flex-grow-1" @click="viewWorksheet(ws)">Náhled</button>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" @click="deleteWorksheet(ws.id)"><i class="bi bi-trash"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="patientWorksheets.length === 0" class="col-12 text-center py-5 border rounded-4 border-dashed">
                  <p class="text-muted">Tomuto pacientovi zatím nebyly přiřazeny žádné pracovní listy.</p>
                </div>
              </div>
            </div>

            <!-- Tab: Surveys -->
            <div v-if="activeTab === 'surveys'" class="fade-in">
              <div class="row g-4">
                <div class="col-md-5">
                  <SurveyQRCode 
                    :patientId="selectedPatient.id" 
                    :patientName="selectedPatient.name"
                    :doctorId="'DOC-default'"
                    sessionId="GEN-INTAKE"
                  />
                </div>
                <div class="col-md-7">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold mb-0">Historie dotazníků</h5>
                    <button class="btn btn-sm btn-link text-primary" @click="fetchSurveys">
                      <i class="bi bi-arrow-clockwise me-1"></i>Aktualizovat
                    </button>
                  </div>
                  <div v-if="isLoadingSurveys" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                  <div v-else class="list-group list-group-flush border rounded-4 overflow-hidden">
                    <div v-for="survey in patientSurveys" :key="survey.id" class="list-group-item p-3">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill">Obecná zpětná vazba</span>
                        <small class="text-muted">{{ formatDate(survey.created_at) }}</small>
                      </div>
                      <div class="survey-results small">
                        <div v-if="survey.duration" class="mb-1"><strong>Délka:</strong> {{ survey.duration }}</div>
                        <div v-if="survey.attention" class="mb-1"><strong>Pozornost:</strong> {{ survey.attention }}</div>
                        <div v-if="survey.answered" class="mb-1"><strong>Zodpovězeno:</strong> {{ survey.answered }}</div>
                        <div v-if="survey.comments" class="mt-2 p-2 bg-light rounded italic text-muted">"{{ survey.comments }}"</div>
                      </div>
                    </div>
                    <div v-if="patientSurveys.length === 0" class="text-center py-5">
                      <i class="bi bi-clipboard-check display-4 opacity-25"></i>
                      <p class="text-muted mt-2">Zatím žádné vyplněné dotazníky.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card border-0 shadow-sm rounded-4 h-100 d-flex align-items-center justify-content-center text-center p-5">
          <div class="opacity-25 mb-4">
            <i class="bi bi-person-bounding-box display-1"></i>
          </div>
          <h4 class="fw-bold text-muted">Vyberte pacienta ze seznamu</h4>
          <p class="text-muted" style="max-width: 300px;">Zobrazte si detaily pacienta, historii jeho sezení a spravujte pracovní listy.</p>
        </div>
      </div>
    </div>

    <!-- Modal: Add Patient -->
    <BModal v-model="showAddPatientModal" title="Nový pacient" @ok="addPatient" ok-title="Uložit" cancel-title="Zrušit">
      <form @submit.prevent="addPatient">
        <div class="mb-3">
          <label class="form-label small fw-bold">Jméno a příjmení</label>
          <input v-model="newPatient.name" type="text" class="form-control" required>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label small fw-bold">Věk</label>
            <input v-model="newPatient.age" type="number" class="form-control" required>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small fw-bold">Pohlaví</label>
            <select v-model="newPatient.gender" class="form-select">
              <option value="Muž">Muž</option>
              <option value="Žena">Žena</option>
              <option value="Jiné">Jiné</option>
            </select>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label small fw-bold">Email</label>
          <input v-model="newPatient.email" type="email" class="form-control">
        </div>
        <div class="mb-3">
          <label class="form-label small fw-bold">Klinické poznámky</label>
          <textarea v-model="newPatient.notes" class="form-control" rows="3"></textarea>
        </div>
      </form>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import SurveyQRCode from '@/components/SurveyQRCode.vue'
import { useSurvey } from '@/composables/useSurvey'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  email: string
  phone?: string
  notes?: string
}

interface Worksheet {
  id: string
  patientId: string
  title: string
  description: string
  completed: boolean
  content?: any
}

// State
const searchQuery = ref('')
const selectedPatient = ref<Patient | null>(null)
const activeTab = ref('info')
const patients = ref<Patient[]>([])
const worksheets = ref<Worksheet[]>([])
const sessions = ref<any[]>([])

// Survey logic
const { fetchSurveys, getSurveysByPatient, isLoading: isLoadingSurveys } = useSurvey()
const patientSurveys = computed(() => {
  if (!selectedPatient.value) return []
  return getSurveysByPatient(selectedPatient.value.id).value
})

// Modal State
const showAddPatientModal = ref(false)
const newPatient = reactive({
  name: '',
  age: 25,
  gender: 'Žena',
  email: '',
  notes: ''
})

// Computed
const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value
  const q = searchQuery.value.toLowerCase()
  return patients.value.filter(p => p.name.toLowerCase().includes(q))
})

const patientWorksheets = computed(() => {
  if (!selectedPatient.value) return []
  return worksheets.value.filter(ws => ws.patientId === selectedPatient.value?.id)
})

const patientSessions = computed(() => {
  if (!selectedPatient.value) return []
  return sessions.value.filter(s => s.patient_id === selectedPatient.value?.id)
})

// Actions
function loadData() {
  patients.value = JSON.parse(localStorage.getItem('doctor_patients') || '[]')
  worksheets.value = JSON.parse(localStorage.getItem('doctor_worksheets') || '[]')
  sessions.value = JSON.parse(localStorage.getItem('published_sessions') || '[]') // Simplified proxy
  
  // Seed initial data if empty
  if (patients.value.length === 0) {
    patients.value = [
      { id: '1', name: 'Anna Nováková', age: 24, gender: 'Žena', email: 'anna@example.com', notes: 'Úzkostná porucha, panic attacks.' },
      { id: '2', name: 'Jan Svoboda', age: 32, gender: 'Muž', email: 'jan@example.com', notes: 'Depresivní epizoda, nespavost.' }
    ]
    savePatients()
  }
}

function savePatients() {
  localStorage.setItem('doctor_patients', JSON.stringify(patients.value))
}

function saveWorksheets() {
  localStorage.setItem('doctor_worksheets', JSON.stringify(worksheets.value))
}

function addPatient() {
  if (!newPatient.name) return
  const id = Math.random().toString(36).substring(2, 9)
  patients.value.unshift({ id: `PAT-${id}`, ...newPatient })
  savePatients()
  showAddPatientModal.value = false
  // Reset
  newPatient.name = ''
  newPatient.email = ''
  newPatient.notes = ''
}

function openCreateWorksheet() {
  alert('Funkce generování pracovních listů se připravuje.')
}

function deleteWorksheet(id: string) {
  if (confirm('Opravdu chcete tento pracovní list smazat?')) {
    worksheets.value = worksheets.value.filter(ws => ws.id !== id)
    saveWorksheets()
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('cs-CZ')
}

function statusClass(status: string) {
  if (status === 'completed') return 'bg-success'
  if (status === 'pending') return 'bg-warning text-dark'
  return 'bg-primary'
}

function viewSession(session: any) {
  console.log('Viewing session:', session)
}

function viewWorksheet(ws: Worksheet) {
  console.log('Viewing worksheet:', ws)
}

function truncate(text: string, len: number) {
  return text.length > len ? text.substring(0, len) + '...' : text
}

onMounted(() => {
  loadData()
  fetchSurveys()
})

// Refresh surveys when tab changes to surveys
watch(activeTab, (newTab) => {
  if (newTab === 'surveys') {
    fetchSurveys()
  }
})
</script>

<style scoped lang="scss">
.patients-view {
  max-width: 1400px;
  margin: 0 auto;
}

.active-patient {
  transition: all 0.2s ease;
}

.avatar {
  flex-shrink: 0;
}

.list-group-item {
  cursor: pointer;
  &:hover {
    background-color: #f8fafc;
  }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.border-dashed {
  border-style: dashed !important;
}

.survey-results {
  line-height: 1.4;
}
</style>