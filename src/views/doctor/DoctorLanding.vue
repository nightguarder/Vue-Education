<template>
  <div class="doctor-landing">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="hero-content text-center">
            <h1 class="hero-title mb-3">
              <i class="bi bi-heart-pulse text-primary me-2"></i>
              Doctor Portal
            </h1>
            <p class="hero-subtitle text-muted mb-5">
              Your AI-powered medical research assistant
            </p>

            <!-- Main Input -->
            <div class="input-container mb-4">
              <div class="input-group input-group-lg">
                <span class="input-group-text bg-white border-end-0">
                  <i class="bi bi-chat-dots text-muted"></i>
                </span>
                <input
                  v-model="userQuery"
                  type="text"
                  class="form-control border-start-0"
                  :placeholder="placeholderText"
                  @keyup.enter="handleRequest"
                  :disabled="!selectedModule"
                />
                <button
                  class="btn btn-primary px-4"
                  @click="handleRequest"
                  :disabled="!selectedModule || !userQuery.trim()"
                >
                  <i class="bi bi-send me-2"></i>
                  Go
                </button>
              </div>
              <p v-if="!selectedModule" class="text-muted small mt-2">
                Select a module below first, then enter your request
              </p>
            </div>

            <!-- Module Selection Buttons -->
            <div class="module-buttons d-flex justify-content-center gap-3 flex-wrap">
              <button
                class="module-btn btn btn-outline-primary"
                :class="{ active: selectedModule === 'chat' }"
                @click="selectModule('chat')"
              >
                <i class="bi bi-chat-dots-fill fs-4 d-block mb-2"></i>
                <span>Medical Chat</span>
              </button>
              <button
                class="module-btn btn btn-outline-success"
                :class="{ active: selectedModule === 'pubmed' }"
                @click="selectModule('pubmed')"
              >
                <i class="bi bi-journal-medical fs-4 d-block mb-2"></i>
                <span>PubMed Search</span>
              </button>
              <button
                class="module-btn btn btn-outline-warning"
                :class="{ active: selectedModule === 'research' }"
                @click="selectModule('research')"
              >
                <i class="bi bi-book fs-4 d-block mb-2"></i>
                <span>Research Notebook</span>
              </button>
              <button
                class="module-btn btn btn-outline-info"
                :class="{ active: selectedModule === 'transcribe' }"
                @click="selectModule('transcribe')"
              >
                <i class="bi bi-mic fs-4 d-block mb-2"></i>
                <span>Audio Transcription</span>
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions mt-5">
              <p class="text-muted small mb-3">Quick Access</p>
              <div class="d-flex justify-content-center gap-2 flex-wrap">
                <router-link to="/doctor/chat" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-chat-dots me-1"></i> Chats
                </router-link>
                <router-link to="/doctor/transcription" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-mic me-1"></i> Transcription
                </router-link>
                <router-link to="/doctor/education" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-search me-1"></i> PubMed
                </router-link>
                <router-link to="/doctor/research" class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-journal-bookmark me-1"></i> Research
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const userQuery = ref('')
const selectedModule = ref<string | null>(null)

const placeholderText = computed(() => {
  if (!selectedModule.value) {
    return 'Select a module below first...'
  }
  const placeholders: Record<string, string> = {
    chat: 'Describe what you want to discuss...',
    pubmed: 'What medical topic do you want to search?',
    research: 'What would you like to research?',
    transcribe: 'Describe the audio you want transcribed...'
  }
  return placeholders[selectedModule.value] || 'How can I help you today?'
})

function selectModule(module: string) {
  selectedModule.value = module
  userQuery.value = ''
}

function handleRequest() {
  if (!selectedModule.value || !userQuery.value.trim()) return

  const query = encodeURIComponent(userQuery.value.trim())

switch (selectedModule.value) {
    case 'chat':
      router.push('/doctor/chat')
      break
    case 'pubmed':
      router.push(`/doctor/education?q=${query}`)
      break
    case 'research':
      router.push(`/doctor/research?q=${query}`)
      break
    case 'transcribe':
      const notes = userQuery.value.trim() ? `Doctor's note: ${userQuery.value.trim()}` : ''
      router.push(notes ? `/doctor/transcription?notes=${encodeURIComponent(notes)}` : '/doctor/transcription')
      break
  }
}
</script>

<style scoped>
.doctor-landing {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  padding: 2rem 0;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c5282;
}

.hero-subtitle {
  font-size: 1.1rem;
}

.input-container {
  max-width: 600px;
  margin: 0 auto;
}

.input-group-text {
  border-right: none;
}

.form-control:focus {
  border-color: #2c5282;
  box-shadow: 0 0 0 0.2rem rgba(44, 82, 130, 0.1);
}

.module-buttons {
  margin-top: 2rem;
}

.module-btn {
  min-width: 120px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.module-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.module-btn.active {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.module-btn.btn-outline-primary.active {
  background-color: #2c5282;
  border-color: #2c5282;
  color: white;
}

.module-btn.btn-outline-success.active {
  background-color: #38a169;
  border-color: #38a169;
  color: white;
}

.module-btn.btn-outline-warning.active {
  background-color: #d69e2e;
  border-color: #d69e2e;
  color: white;
}

.module-btn.btn-outline-info.active {
  background-color: #3182ce;
  border-color: #3182ce;
  color: white;
}

.quick-actions .btn {
  border-radius: 20px;
}
</style>