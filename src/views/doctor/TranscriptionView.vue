<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-white py-3 border-bottom">
            <h4 class="card-title mb-1 fw-bold text-primary">
              <i class="bi bi-mic me-2"></i>Přepis konzultací
            </h4>
            <p class="card-text text-muted mb-0 small">
              Nahrajte audio záznam sezení pro automatickou analýzu a vytvoření klinického chatu.
            </p>

            <!-- Model Status -->
            <div class="mt-3 d-flex align-items-center gap-3 flex-wrap">
              <div
                class="form-check form-switch d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill border"
              >
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="transcriptionModeToggle"
                  v-model="useLocalModel"
                />
                <label class="form-check-label small mb-0 fw-medium" for="transcriptionModeToggle">
                  <i
                    :class="
                      useLocalModel ? 'bi bi-gpu-card text-warning' : 'bi bi-server text-success'
                    "
                  ></i>
                  {{ useLocalModel ? 'WebGPU (Local)' : 'OMLX (Cloud)' }}
                </label>
              </div>

              <div v-if="!useLocalModel" class="d-flex align-items-center gap-2">
                <span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                  <i class="bi bi-check-circle me-1"></i> Připraveno
                </span>
              </div>

              <div v-else class="d-flex align-items-center gap-2 flex-wrap">
                <button
                  v-if="!webGpuModelReady"
                  class="btn btn-sm btn-warning rounded-pill px-3"
                  @click="loadTranscriptionModel"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-download me-2"></i>
                  {{ isLoading ? `Načítání... ${Math.round(downloadProgress)}%` : 'Načíst model' }}
                </button>
                <span v-else class="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                  <i class="bi bi-check-circle me-1"></i> Model připraven
                </span>
              </div>
              <span v-if="error" class="badge bg-danger rounded-pill">{{ error }}</span>
            </div>
          </div>

          <div class="card-body p-4">
            <!-- Patient Selection / Details -->
            <div class="patient-form mb-4 p-4 bg-light rounded-4 border">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0 fw-bold">
                  <i class="bi bi-person-badge me-2 text-primary"></i>Identifikace pacienta
                </h6>
                <div
                  v-if="!existingChatId"
                  class="btn-group btn-group-sm rounded-pill overflow-hidden border"
                >
                  <button
                    class="btn btn-white px-3"
                    :class="{ 'bg-primary text-white': !isExistingPatient }"
                    @click="isExistingPatient = false"
                  >
                    Nový
                  </button>
                  <button
                    class="btn btn-white px-3"
                    :class="{ 'bg-primary text-white': isExistingPatient }"
                    @click="isExistingPatient = true"
                  >
                    Stávající
                  </button>
                </div>
                <div v-else>
                  <span class="badge bg-primary rounded-pill px-3 py-2">
                    <i class="bi bi-arrow-return-left me-1"></i>Doplnění sezení
                  </span>
                </div>
              </div>

              <div v-if="!isExistingPatient" class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Celé jméno *</label>
                  <input
                    v-model="patientName"
                    type="text"
                    class="form-control"
                    placeholder="Jméno a příjmení"
                    required
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Věk</label>
                  <input
                    v-model="patientAge"
                    type="number"
                    class="form-control"
                    placeholder="Věk"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small fw-bold">Pohlaví</label>
                  <select v-model="patientGender" class="form-select">
                    <option value="">Vybrat</option>
                    <option value="Muž">Muž</option>
                    <option value="Žena">Žena</option>
                    <option value="Jiné">Jiné</option>
                  </select>
                </div>
              </div>

              <div v-else class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-bold">Vyberte pacienta z evidence</label>
                  <select v-model="selectedPatientId" class="form-select" @change="syncPatientInfo">
                    <option value="">-- Vyberte pacienta --</option>
                    <option v-for="p in patients" :key="p.patient_id" :value="p.patient_id">
                      {{ p.name }} ({{ p.patient_id }})
                    </option>
                  </select>
                </div>
              </div>

              <div class="row mt-3">
                <div class="col-12">
                  <label class="form-label small fw-bold">Poznámky k sezení</label>
                  <textarea
                    v-model="patientNotes"
                    class="form-control"
                    rows="2"
                    placeholder="Kontext sezení, aktuální stav..."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Upload Area -->
            <div
              class="upload-area text-center p-5 mb-4 rounded-4 border-dashed"
              :class="{ 'border-primary bg-primary bg-opacity-10': isDragging }"
              @dragenter.prevent="handleDragEnter"
              @dragover.prevent="handleDragEnter"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <div v-if="!audioFile">
                <i class="bi bi-cloud-upload display-4 text-primary opacity-50 mb-3"></i>
                <h5 class="fw-bold">Nahrát audio záznam</h5>
                <p class="text-muted small">Přetáhněte soubor sem nebo jej vyberte ze složky</p>
                <label class="btn btn-primary rounded-pill px-4 shadow-sm mt-2">
                  <i class="bi bi-folder2-open me-2"></i>Vybrat soubor
                  <input type="file" accept="audio/*" class="d-none" @change="handleFileSelect" />
                </label>
              </div>

              <div v-else class="selected-file">
                <div
                  class="d-flex align-items-center justify-content-between mb-3 p-3 bg-white rounded-4 border shadow-sm"
                >
                  <div class="d-flex align-items-center text-start">
                    <div class="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                      <i class="bi bi-file-earmark-music text-primary h4 mb-0"></i>
                    </div>
                    <div>
                      <div class="fw-bold text-dark text-truncate" style="max-width: 250px">
                        {{ audioFile.name }}
                      </div>
                      <small class="text-muted">{{ formatDuration(audioDuration) }}</small>
                    </div>
                  </div>
                  <button class="btn btn-outline-danger btn-sm rounded-circle" @click="clearFile">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <audio v-if="audioUrl" :src="audioUrl" controls class="w-100 mb-4 px-2"></audio>

                <button
                  class="btn btn-primary btn-lg rounded-pill px-5 shadow"
                  @click="startTranscription"
                  :disabled="isTranscribing || !audioFile || !patientName"
                >
                  <span v-if="isTranscribing" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-play-circle-fill me-2"></i>
                  {{ isTranscribing ? 'Probíhá přepis...' : 'Spustit analýzu sezení' }}
                </button>
              </div>
            </div>

            <!-- Results -->
            <div v-if="transcriptionResult" class="mt-4 fade-in">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Výsledek přepisu</h5>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary px-3" @click="copyToClipboard">
                    <i class="bi bi-clipboard me-1"></i>Kopírovat
                  </button>
                  <button class="btn btn-outline-secondary px-3" @click="downloadTranscript">
                    <i class="bi bi-download me-1"></i>Stáhnout
                  </button>
                </div>
              </div>

              <div class="p-3 bg-light rounded-4 border mb-4 transcription-text shadow-inner">
                {{ formattedTranscription }}
              </div>
            </div>

            <!-- Success Notification & Next Steps -->
            <div
              v-if="createdChat"
              class="mt-4 p-4 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-4 fade-in"
            >
              <div class="row align-items-center">
                <div class="col-md-8">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-check-circle-fill text-success h4 mb-0 me-3"></i>
                    <h5 class="text-success fw-bold mb-0">
                      {{
                        existingChatId
                          ? 'Přepis byl přidán k sezení!'
                          : 'Sezení bylo úspěšně vytvořeno!'
                      }}
                    </h5>
                  </div>
                  <p class="text-muted mb-3 mb-md-0">
                    {{
                      existingChatId
                        ? 'Nyní můžete pokračovat k AI analýze v chatu.'
                        : 'Nyní můžete pokračovat k AI analýze nebo požádat pacienta o vyplnění vstupního dotazníku.'
                    }}
                  </p>
                </div>
                <div class="col-md-4 text-md-end">
                  <div class="d-grid gap-2">
                    <router-link
                      :to="`/doctor/chat/${createdChat.chatId}`"
                      class="btn btn-success rounded-pill"
                    >
                      <i class="bi bi-chat-dots me-2"></i>Přejít do chatu
                    </router-link>
                    <button
                      v-if="!existingChatId"
                      class="btn btn-outline-success rounded-pill"
                      @click="showQrModal = true"
                    >
                      <i class="bi bi-qr-code me-2"></i>Zobrazit QR kód
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Modal -->
    <BModal v-model="showQrModal" title="Vstupní dotazník pro pacienta" hide-footer centered>
      <div v-if="createdChat">
        <SurveyQRCode
          :sessionId="createdChat.chatId"
          :patientId="createdChat.patientId"
          :patientName="createdChat.patientName"
          :doctorId="'DOC-default'"
        />
        <div class="text-center mt-3 text-muted small">
          Ukažte tento kód pacientovi pro vyplnění zpětné vazby.
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storageService } from '@/services/storageService'
import { useClinicalData } from '@/composables/useClinicalData'
import { useTranscription } from '@/composables/useTranscription'

const { startNewSession, appendTranscript } = useClinicalData()
import SurveyQRCode from '@/components/SurveyQRCode.vue'

const MAX_AUDIO_DURATION_SECONDS = 24 * 60

const router = useRouter()
const route = useRoute()

const { isLoading, downloadProgress, error, useLocalModel, loadModel, transcribeFile } =
  useTranscription()

// Patient logic
const isExistingPatient = ref(false)
const patients = ref<any[]>([])
const selectedPatientId = ref('')
const patientName = ref('')
const patientAge = ref<number | undefined>(undefined)
const patientGender = ref('')
const patientNotes = ref('')

async function loadPatients() {
  try {
    patients.value = await storageService.getPatients()
  } catch (e) {
    console.error('[Transcription] Load patients failed:', e)
  }
}

function syncPatientInfo() {
  const p = patients.value.find((p) => p.id === selectedPatientId.value)
  if (p) {
    patientName.value = p.name
    patientAge.value = p.age
    patientGender.value = p.gender
  }
}

// Audio state
const isDragging = ref(false)
const audioFile = ref<File | null>(null)
const audioUrl = ref('')
const audioDuration = ref(0)

// Transcription state
const isTranscribing = ref(false)
const transcriptionStatus = ref('')
const transcriptionResult = ref('')
const transcriptionStartTime = ref(0)
const transcriptionEndTime = ref(0)
const webGpuModelReady = ref(false)
const showQrModal = ref(false)

// Existing chat prefill
const existingChatId = ref('')

// Created chat
const createdChat = ref<{ chatId: string; patientName: string; patientId: string } | null>(null)

const formattedTranscription = computed(() => {
  return transcriptionResult.value.replace(/▁/g, ' ').trim()
})

onMounted(() => {
  loadPatients()
  const notesParam = route.query.notes as string
  if (notesParam) {
    patientNotes.value = decodeURIComponent(notesParam)
  }

  const chatIdParam = route.query.chatId as string
  if (chatIdParam) {
    existingChatId.value = chatIdParam
    isExistingPatient.value = false

    const nameParam = route.query.patientName as string
    const ageParam = route.query.patientAge as string
    const genderParam = route.query.patientGender as string
    const notesParam = route.query.patientNotes as string

    if (nameParam) patientName.value = decodeURIComponent(nameParam)
    if (ageParam) patientAge.value = parseInt(ageParam) || undefined
    if (genderParam) patientGender.value = decodeURIComponent(genderParam)
    if (notesParam) patientNotes.value = decodeURIComponent(notesParam)
  }
})

async function loadTranscriptionModel() {
  const result = await loadModel()
  if (result) webGpuModelReady.value = true
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) setAudioFile(target.files[0])
}

let dragCounter = 0
function handleDragEnter() {
  dragCounter++
  isDragging.value = true
}
function handleDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragging.value = false
  }
}
function handleDrop(event: DragEvent) {
  dragCounter = 0
  isDragging.value = false
  if (event.dataTransfer?.files?.[0]) setAudioFile(event.dataTransfer.files[0])
}

function setAudioFile(file: File) {
  if (!file.type.startsWith('audio/')) {
    alert('Vyberte prosím audio soubor')
    return
  }
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioFile.value = file
  audioUrl.value = URL.createObjectURL(file)
  const audio = new Audio()
  audio.src = audioUrl.value
  audio.onloadedmetadata = () => {
    audioDuration.value = audio.duration
  }
}

function clearFile() {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioFile.value = null
  audioUrl.value = ''
  audioDuration.value = 0
  transcriptionResult.value = ''
  createdChat.value = null
}

async function startTranscription() {
  if (!audioFile.value || !patientName.value) return

  isTranscribing.value = true
  transcriptionStatus.value = 'Zpracování audia...'
  transcriptionResult.value = ''
  createdChat.value = null
  transcriptionStartTime.value = Date.now()

  try {
    const result = await transcribeFile(audioFile.value, (status) => {
      transcriptionStatus.value = status
    })

    if (!result || !result.text) {
      throw new Error('Nepodařilo se získat text z audia.')
    }

    transcriptionResult.value = result.text
    transcriptionEndTime.value = Date.now()
    const now = new Date().toISOString()

    if (existingChatId.value) {
      await handleExistingSessionUpdate(result.text, now)
    } else {
      await handleNewSessionCreation(result.text, now)
    }
  } catch (err: any) {
    console.error('[Transcription] Error:', err)
    transcriptionStatus.value = `Chyba při přepisu: ${err.message}`
    alert(`Analýza selhala: ${err.message}`)
  } finally {
    isTranscribing.value = false
  }
}

async function handleExistingSessionUpdate(transcript: string, timestamp: string) {
  try {
    const session = await appendTranscript(existingChatId.value, transcript)

    let analysis = session.ai_analysis
    if (typeof analysis === 'string') analysis = JSON.parse(analysis)

    createdChat.value = {
      chatId: session.session_id,
      patientName: analysis?.patientName || 'Pacient',
      patientId: session.patient_id
    }
  } catch (e: any) {
    console.error('[Transcription] Failed to update session:', e)
    throw e
  }
}

async function handleNewSessionCreation(transcript: string, timestamp: string) {
  try {
    const { session, patientId } = await startNewSession({
      patientId: isExistingPatient.value ? selectedPatientId.value : undefined,
      patientData: isExistingPatient.value ? undefined : {
        name: patientName.value,
        age: patientAge.value,
        gender: patientGender.value,
        notes: patientNotes.value,
      },
      transcript: transcript,
      notes: patientNotes.value
    })

    let analysis = session.ai_analysis
    if (typeof analysis === 'string') analysis = JSON.parse(analysis)

    createdChat.value = {
      chatId: session.session_id,
      patientName: analysis?.patientName || patientName.value,
      patientId: patientId,
    }
  } catch (e: any) {
    console.error('[Transcription] Failed to create new session:', e)
    throw e
  }
}
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function copyToClipboard() {
  navigator.clipboard.writeText(transcriptionResult.value)
}
function downloadTranscript() {
  const blob = new Blob([transcriptionResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pripis-${patientName.value}-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #e2e8f0;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.upload-area:hover {
  border-color: var(--bs-primary);
  background: #f1f5f9;
}

.transcription-text {
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style scoped>
.upload-area {
  border: 2px dashed #e2e8f0;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.upload-area:hover {
  border-color: var(--bs-primary);
  background: #f1f5f9;
}

.transcription-text {
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
