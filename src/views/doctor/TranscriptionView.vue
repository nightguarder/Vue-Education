<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">
              <i class="bi bi-mic me-2"></i>Audio Transcription
            </h4>
            <p class="card-text text-muted mb-0 small">
              Enter patient details, upload audio, and a new chat session will be created automatically.
            </p>
            
            <!-- Model Status -->
            <div class="mt-2 d-flex align-items-center gap-3 flex-wrap">
              <button 
                v-if="!modelReady"
                class="btn btn-sm btn-warning"
                @click="loadTranscriptionModel"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-download me-2"></i>
                {{ isLoading ? `Loading model... ${Math.round(downloadProgress)}%` : 'Load Transcription Model' }}
              </button>
              <span v-else class="badge bg-success me-2">
                <i class="bi bi-check-circle me-1"></i> {{ isWebGPU ? 'WebGPU' : 'OMLX' }} ready
              </span>
              
              <!-- Toggle Switch -->
              <div v-if="modelReady" class="form-check form-switch d-flex align-items-center gap-2">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="transcriptionModeToggle"
                  v-model="useLocalModel"
                  @change="toggleTranscriptionMode"
                />
                <label class="form-check-label small mb-0" for="transcriptionModeToggle">
                  <i :class="useLocalModel ? 'bi bi-gpu-card text-primary' : 'bi bi-server text-success'"></i>
                  {{ useLocalModel ? 'WebGPU (Local)' : 'OMLX (Server)' }}
                </label>
              </div>
              
              <span v-if="error" class="badge bg-danger">{{ error }}</span>
            </div>
          </div>
          
          <div class="card-body">
            <!-- Patient Details Form -->
            <div class="patient-form mb-4 p-3 bg-light rounded">
              <h6 class="mb-3"><i class="bi bi-person-badge me-2"></i>Patient Details</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small">Full Name *</label>
                  <input 
                    v-model="patientName" 
                    type="text" 
                    class="form-control form-control-sm"
                    placeholder="Enter patient full name"
                    required
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small">Age</label>
                  <input 
                    v-model="patientAge" 
                    type="number" 
                    class="form-control form-control-sm"
                    placeholder="Age"
                    min="0"
                    max="150"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small">Gender</label>
                  <select v-model="patientGender" class="form-select form-select-sm">
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label small">Notes (optional)</label>
                  <input 
                    v-model="patientNotes" 
                    type="text" 
                    class="form-control form-control-sm"
                    placeholder="Any additional notes about this session"
                  />
                </div>
              </div>
            </div>

            <!-- Upload Area -->
            <div 
              class="upload-area text-center p-5 mb-4"
              :class="{ 'border-primary bg-light': isDragging }"
              @dragenter.prevent="handleDragEnter"
              @dragover.prevent="handleDragEnter"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <div v-if="!audioFile">
                <i class="bi bi-cloud-upload display-4 text-muted mb-3"></i>
                <h5>Drag & drop audio file here</h5>
                <p class="text-muted">or</p>
                <label class="btn btn-outline-primary">
                  <i class="bi bi-folder me-2"></i>Browse Files
                  <input 
                    type="file" 
                    accept="audio/*" 
                    class="d-none"
                    @change="handleFileSelect"
                  />
                </label>
                <p class="text-muted small mt-2">Max 25 minutes (24 min for WebGPU)</p>
              </div>
              
              <!-- Selected File -->
              <div v-else class="selected-file">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <i class="bi bi-file-audio display-6 text-primary me-3"></i>
                    <span class="fw-bold">{{ audioFile.name }}</span>
                    <span class="text-muted ms-2">({{ formatDuration(audioDuration) }})</span>
                  </div>
                  <button class="btn btn-sm btn-outline-danger" @click="clearFile">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                
                <!-- Audio Preview -->
                <audio v-if="audioUrl" :src="audioUrl" controls class="w-100 mb-3"></audio>
                
                <button 
                  class="btn btn-primary"
                  @click="startTranscription"
                  :disabled="!modelReady || isTranscribing || !audioFile || !patientName"
                >
                  <span v-if="isTranscribing" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-play-fill me-2"></i>
                  {{ isTranscribing ? 'Transcribing...' : 'Start Transcription' }}
                </button>
                
                <p v-if="audioDuration > MAX_AUDIO_DURATION_SECONDS" class="text-warning small mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  Audio exceeds 24 minute limit. Local processing will fallback to OMLX.
                </p>
              </div>
            </div>
            
            <!-- Progress -->
            <div v-if="isTranscribing" class="text-center py-3">
              <div class="spinner-border text-primary mb-2"></div>
              <p class="text-muted">{{ transcriptionStatus }}</p>
            </div>
            
            <!-- Results -->
            <div v-if="transcriptionResult" class="mt-4">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">Transcription</h5>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="copyToClipboard">
                    <i class="bi bi-clipboard me-1"></i>Copy
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="downloadTranscript">
                    <i class="bi bi-download me-1"></i>Download
                  </button>
                </div>
              </div>
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                  <span class="text-muted small">
                    <i class="bi bi-chat-quote me-1"></i>Transcribed Text
                  </span>
                  <span class="badge bg-info text-dark">{{ useLocalModel ? 'WebGPU' : 'OMLX' }}</span>
                </div>
                <div class="card-body">
                  <div class="p-3 bg-light rounded transcription-text">{{ formattedTranscription }}</div>
                </div>
              </div>
              
              <!-- Chat Created Notification -->
              <div v-if="createdChat" class="mt-3 p-3 bg-success bg-opacity-10 border border-success rounded">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <i class="bi bi-check-circle text-success me-2"></i>
                    <span class="text-success fw-semibold">Chat session created!</span>
                    <p class="mb-0 small text-muted">
                      Patient: {{ createdChat.patientName }} | ID: <code>{{ createdChat.chatId }}</code>
                    </p>
                  </div>
                  <router-link 
                    :to="`/doctor/chat/${createdChat.chatId}`" 
                    class="btn btn-success btn-sm"
                  >
                    <i class="bi bi-chat-dots me-2"></i>Open Chat
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTranscription } from '@/composables/useTranscription'

const MAX_AUDIO_DURATION_SECONDS = 24 * 60 // 24 minutes
const CHAT_STORAGE_KEY = 'doctor_chats'

const router = useRouter()
const route = useRoute()

const { 
  isLoading, 
  isReady: modelReady, 
  downloadProgress, 
  error,
  isWebGPU,
  useLocalModel,
  toggleTranscriptionMode,
  loadModel,
  transcribeFile 
} = useTranscription()

// Patient details
const patientName = ref('')
const patientAge = ref<number | undefined>(undefined)
const patientGender = ref('')
const patientNotes = ref('')

// Audio state
const isDragging = ref(false)
const audioFile = ref<File | null>(null)
const audioUrl = ref('')
const audioDuration = ref(0)

// Transcription state
const isTranscribing = ref(false)
const transcriptionStatus = ref('')
const transcriptionResult = ref('')

// Created chat
const createdChat = ref<{ chatId: string; patientName: string } | null>(null)

// Format transcription - replace SentencePiece ▁ with spaces
const formattedTranscription = computed(() => {
  return transcriptionResult.value.replace(/▁/g, ' ').trim()
})

onMounted(() => {
  const notesParam = route.query.notes as string
  if (notesParam) {
    patientNotes.value = decodeURIComponent(notesParam)
  }
})

async function loadTranscriptionModel() {
  isLoading.value = true
  await loadModel()
  isLoading.value = false
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    setAudioFile(target.files[0])
  }
}

// Drag counter to handle child elements
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
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    setAudioFile(event.dataTransfer.files[0])
  }
}

function setAudioFile(file: File) {
  if (!file.type.startsWith('audio/')) {
    alert('Please select an audio file')
    return
  }
  
  audioFile.value = file
  audioUrl.value = URL.createObjectURL(file)
  
  const audio = new Audio()
  audio.src = audioUrl.value
  audio.onloadedmetadata = () => {
    audioDuration.value = audio.duration
  }
}

function clearFile() {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  audioFile.value = null
  audioUrl.value = ''
  audioDuration.value = 0
  transcriptionResult.value = ''
  createdChat.value = null
}

function generateChatId(): string {
  return 'CHAT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

function saveChatToLocalStorage(chatData: any) {
  try {
    const existingChats = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]')
    existingChats.unshift(chatData)
    // Keep only last 50 chats
    if (existingChats.length > 50) {
      existingChats.splice(50)
    }
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(existingChats))
  } catch (e) {
    console.error('[Transcription] Failed to save chat:', e)
  }
}

async function startTranscription() {
  if (!audioFile.value || !modelReady.value || !patientName.value) return
  
  isTranscribing.value = true
  transcriptionStatus.value = 'Processing audio...'
  transcriptionResult.value = ''
  createdChat.value = null
  
  try {
    const result = await transcribeFile(audioFile.value)
    transcriptionResult.value = result.text
    transcriptionStatus.value = 'Complete!'
    
    // Create chat session
    const chatId = generateChatId()
    const chatData = {
      chatId,
      patientName: patientName.value,
      patientAge: patientAge.value,
      patientGender: patientGender.value,
      patientNotes: patientNotes.value,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      transcript: result.text,
      messages: [
        {
          role: 'system',
          content: `Patient: ${patientName.value}${patientAge.value ? `, Age: ${patientAge.value}` : ''}${patientGender.value ? `, Gender: ${patientGender.value}` : ''}${patientNotes.value ? `\nNotes: ${patientNotes.value}` : ''}`
        },
        {
          role: 'user',
          content: `[Audio Transcript]\n\n${result.text}`,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    saveChatToLocalStorage(chatData)
    
    createdChat.value = {
      chatId,
      patientName: patientName.value
    }
    
  } catch (error: any) {
    console.error('[Transcription] Error:', error)
    transcriptionResult.value = `Transcription failed: ${error.message}`
  } finally {
    isTranscribing.value = false
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
  a.download = `transcript-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #2c5282;
}

.upload-area.border-primary {
  border-style: solid;
}

.transcription-text {
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}
</style>