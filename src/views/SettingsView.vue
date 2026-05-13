<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">OMLX Settings</h4>
            <p class="card-text text-muted mb-0 small">
              Nakonfigurujte připojení a modely lokální AI služby.
            </p>
          </div>
          <div class="card-body">
            <div v-if="saveSuccess" class="alert alert-success alert-dismissible">
              Nastavení bylo úspěšně uloženo!
              <button type="button" class="btn-close" @click="saveSuccess = false"></button>
            </div>
            <div
              v-if="testResult"
              :class="[
                'alert',
                testResult.success ? 'alert-success' : 'alert-danger',
                'alert-dismissible',
              ]"
            >
              {{ testResult.message }}
              <button type="button" class="btn-close" @click="testResult = null"></button>
            </div>
            <div
              v-if="dbTestResult"
              :class="[
                'alert',
                dbTestResult.success ? 'alert-success' : 'alert-danger',
                'alert-dismissible',
              ]"
            >
              {{ dbTestResult.message }}
              <button type="button" class="btn-close" @click="dbTestResult = null"></button>
            </div>
            <h5 class="mb-3">Nastavení připojení</h5>
            <form @submit.prevent="saveSettings">
              <div class="mb-3">
                <label class="form-label">OMLX Port</label>
                <input
                  v-model="config.port"
                  type="number"
                  class="form-control"
                  placeholder="8888"
                />
                <div class="form-text">Port, na kterém běží služba OMLX lokálně.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">API Key</label>
                <div class="input-group">
                  <input
                    v-model="config.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    class="form-control"
                    :class="{ 'is-invalid': !isApiKeyValid }"
                    placeholder="Zadejte váš API klíč..."
                  />
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="showApiKey = !showApiKey"
                  >
                    <i :class="showApiKey ? 'bi bi-eye-slash' : 'bi bi-eye-fill'"></i>
                  </button>
                </div>
                <div class="invalid-feedback" v-if="!isApiKeyValid">
                  API klíč musí mít alespoň 4 znaky.
                </div>
                <div class="form-text">API klíč pro autentizaci služby OMLX.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Výchozí model</label>
                <div class="input-group">
                  <select v-model="config.model" class="form-select">
                    <option v-for="m in availableModels" :key="m.value" :value="m.value">
                      {{ m.text }}
                    </option>
                  </select>
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="fetchModels"
                    :disabled="loadingModels"
                  >
                    <span v-if="loadingModels" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <div class="form-text">Model používaný pro generování textu.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Překladový model</label>
                <div class="input-group">
                  <select v-model="config.transModel" class="form-select">
                    <option v-for="m in availableModels" :key="m.value" :value="m.value">
                      {{ m.text }}
                    </option>
                  </select>
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="fetchModels"
                    :disabled="loadingModels"
                  >
                    <span v-if="loadingModels" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <div class="form-text">Model používaný pro překlady.</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Transkripční model (Parakeet)</label>
                <div class="input-group">
                  <select v-model="config.transcriptModel" class="form-select">
                    <option v-for="m in transcriptModels" :key="m.value" :value="m.value">
                      {{ m.text }}
                    </option>
                  </select>
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="fetchTranscriptModels"
                    :disabled="loadingTranscriptModels"
                  >
                    <span
                      v-if="loadingTranscriptModels"
                      class="spinner-border spinner-border-sm"
                    ></span>
                    <i v-else class="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <div class="form-text">Model používaný pro přepis audia (Parakeet TDT).</div>
              </div>

              <hr class="my-4">
              <div class="d-flex align-items-center mb-3">
                <button class="btn btn-sm btn-outline-secondary" type="button" @click="showAdvanced = !showAdvanced">
                  <i :class="showAdvanced ? 'bi bi-chevron-down' : 'bi bi-chevron-right'" class="me-1"></i>
                  Pokročilé nastavení
                </button>
              </div>
              <div v-if="showAdvanced" class="fade-in">
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label small">Max. tokenů (chat)</label>
                    <input v-model.number="config.chatMaxTokens" type="range" min="256" max="4096" step="128" class="form-range">
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">256</small>
                      <small class="fw-bold">{{ config.chatMaxTokens }}</small>
                      <small class="text-muted">4096</small>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small">Max. tokenů (shrnutí)</label>
                    <input v-model.number="config.summaryMaxTokens" type="range" min="512" max="4096" step="128" class="form-range">
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">512</small>
                      <small class="fw-bold">{{ config.summaryMaxTokens }}</small>
                      <small class="text-muted">4096</small>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small">Teplota</label>
                    <input v-model.number="config.temperature" type="range" min="0" max="2" step="0.1" class="form-range">
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">0</small>
                      <small class="fw-bold">{{ config.temperature.toFixed(1) }}</small>
                      <small class="text-muted">2</small>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label small">Systémová prompt (chat)</label>
                  <textarea v-model="config.systemPrompt" class="form-control" rows="4" placeholder="Výchozí systémová prompt se použije pokud je prázdné."></textarea>
                  <div class="form-text">Upravuje chování AI v chatu. Pokud je prázdné, použije se výchozí prompt.</div>
                </div>
              </div>

              <div class="d-flex gap-2 mb-4">
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-lg me-1"></i> Uložit nastavení
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="testConnection"
                  :disabled="testing"
                >
                  <span v-if="testing" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-plug me-1"></i>
                  {{ testing ? 'Testování...' : 'Test OMLX' }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline-info"
                  @click="testDbConnection"
                  :disabled="dbTesting"
                >
                  <span v-if="dbTesting" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-database me-1"></i>
                  Test DB
                </button>
                 <!-- Sync & Status Indicator -->
    <div class="ms-3 d-flex align-items-center gap-2">
      <div v-if="storageService.pendingCount.value > 0" class="sync-indicator d-flex align-items-center gap-1 text-muted small">
        <i class="bi bi-cloud-arrow-up" :class="{ 'syncing-animation': storageService.isSyncing.value }"></i>
        <span>{{ storageService.pendingCount.value }} {{ getPendingText(storageService.pendingCount.value) }}</span>
      </div>
    </div>
              </div>
              
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { storageService } from '@/services/storageService'

const OMLX_API_URL_KEY = 'omlx_url'
const OMLX_MODEL_KEY = 'omlx_model'
const OMLX_TRANSLATION_MODEL_KEY = 'omlx_model_translation'
const OMLX_API_KEY_KEY = 'omlx_api_key'
const OMLX_TRANSCRIPT_MODEL_KEY = 'omlx_transcript_model'
const OMLX_CHAT_MAX_TOKENS_KEY = 'omlx_chat_max_tokens'
const OMLX_SUMMARY_MAX_TOKENS_KEY = 'omlx_summary_max_tokens'
const OMLX_TEMPERATURE_KEY = 'omlx_temperature'
const OMLX_CHAT_SYSTEM_PROMPT_KEY = 'omlx_chat_system_prompt'

const showApiKey = ref(false)
const showAdvanced = ref(false)
const availableModels = ref<{ value: string; text: string }[]>([
  { value: 'gemma-4-e4b-it-OptiQ-4bit', text: 'gemma-4-e4b-it-OptiQ-4bit (výchozí)' },
])
const transcriptModels = ref<{ value: string; text: string }[]>([
  { value: 'parakeet-tdt-0.6b-v3', text: 'parakeet-tdt-0.6b-v3 (výchozí)' },
])
const loadingModels = ref(false)
const loadingTranscriptModels = ref(false)

const config = reactive({
  port: import.meta.env.VITE_OMLX_PORT || '8888',
  apiKey: import.meta.env.VITE_OMLX_API_KEY || '5004',
  model: 'gemma-4-e4b-it-OptiQ-4bit',
  transModel: 'gemma-4-e4b-it-OptiQ-4bit',
  transcriptModel: 'parakeet-tdt-0.6b-v3',
  chatMaxTokens: 1024,
  summaryMaxTokens: 2048,
  temperature: 0.7,
  systemPrompt: '',
})

const isApiKeyValid = computed(() => config.apiKey.length >= 4)

onMounted(async () => {
  const savedUrl = localStorage.getItem(OMLX_API_URL_KEY)
  if (savedUrl) {
    const match = savedUrl.match(/:(\d+)/)
    if (match) config.port = match[1] ?? config.port
  }
  const savedModel = localStorage.getItem(OMLX_MODEL_KEY)
  if (savedModel) config.model = savedModel
  const savedTransModel = localStorage.getItem(OMLX_TRANSLATION_MODEL_KEY)
  if (savedTransModel) config.transModel = savedTransModel
  const savedApiKey = localStorage.getItem(OMLX_API_KEY_KEY)
  if (savedApiKey) config.apiKey = savedApiKey
  const savedTranscriptModel = localStorage.getItem(OMLX_TRANSCRIPT_MODEL_KEY)
  if (savedTranscriptModel) config.transcriptModel = savedTranscriptModel

  const savedChatMaxTokens = localStorage.getItem(OMLX_CHAT_MAX_TOKENS_KEY)
  if (savedChatMaxTokens) config.chatMaxTokens = parseInt(savedChatMaxTokens)

  const savedSummaryMaxTokens = localStorage.getItem(OMLX_SUMMARY_MAX_TOKENS_KEY)
  if (savedSummaryMaxTokens) config.summaryMaxTokens = parseInt(savedSummaryMaxTokens)

  const savedTemperature = localStorage.getItem(OMLX_TEMPERATURE_KEY)
  if (savedTemperature) config.temperature = parseFloat(savedTemperature)

  const savedSystemPrompt = localStorage.getItem(OMLX_CHAT_SYSTEM_PROMPT_KEY)
  if (savedSystemPrompt) config.systemPrompt = savedSystemPrompt

  if (config.port && config.apiKey) {
    fetchModels()
    fetchTranscriptModels()
  }
})

async function fetchModels() {
  loadingModels.value = true
  try {
    const response = await fetch(`http://127.0.0.1:${config.port}/v1/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.data) {
        availableModels.value = data.data.map((m: any) => ({
          value: m.id,
          text: m.id,
        }))
      }
    }
  } catch (err) {
    console.error('Failed to fetch models:', err)
  } finally {
    loadingModels.value = false
  }
}

async function fetchTranscriptModels() {
  loadingTranscriptModels.value = true
  try {
    const response = await fetch(`http://127.0.0.1:${config.port}/v1/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.data) {
        const parakeetModels = data.data
          .filter((m: any) => m.id.toLowerCase().includes('parakeet'))
          .map((m: any) => ({ value: m.id, text: m.id }))
        if (parakeetModels.length > 0) {
          transcriptModels.value = parakeetModels
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch transcript models:', err)
  } finally {
    loadingTranscriptModels.value = false
  }
}

const saveSuccess = ref(false)
const testing = ref(false)
const dbTesting = ref(false)
const dbTestResult = ref<{ success: boolean; message: string } | null>(null)
const testResult = ref<{ success: boolean; message: string } | null>(null)

function saveSettings() {
  const url = `http://127.0.0.1:${config.port}/v1/chat/completions`
  localStorage.setItem(OMLX_API_URL_KEY, url)
  localStorage.setItem(OMLX_MODEL_KEY, config.model)
  localStorage.setItem(OMLX_TRANSLATION_MODEL_KEY, config.transModel)
  localStorage.setItem(OMLX_API_KEY_KEY, config.apiKey)
  localStorage.setItem(OMLX_TRANSCRIPT_MODEL_KEY, config.transcriptModel)
  localStorage.setItem(OMLX_CHAT_MAX_TOKENS_KEY, String(config.chatMaxTokens))
  localStorage.setItem(OMLX_SUMMARY_MAX_TOKENS_KEY, String(config.summaryMaxTokens))
  localStorage.setItem(OMLX_TEMPERATURE_KEY, String(config.temperature))
  if (config.systemPrompt) {
    localStorage.setItem(OMLX_CHAT_SYSTEM_PROMPT_KEY, config.systemPrompt)
  } else {
    localStorage.removeItem(OMLX_CHAT_SYSTEM_PROMPT_KEY)
  }

  const settings = JSON.parse(localStorage.getItem('local_omlx_settings') || '{}')
  settings.transcriptModel = config.transcriptModel
  localStorage.setItem('local_omlx_settings', JSON.stringify(settings))

  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  dbTestResult.value = null

  try {
    await fetchModels()

    const url = `http://127.0.0.1:${config.port}/v1/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      }),
    })

    if (response.ok) {
      testResult.value = {
        success: true,
        message: 'Spojení bylo úspěšně navázáno. Služba OMLX je aktivní.',
      }
    } else {
      let errorMsg = `Kód chyby: ${response.status}`
      if (response.status === 401) errorMsg = 'Neautorizovaný přístup (401).'
      else if (response.status === 404) errorMsg = 'Model nebyl nalezen (404).'

      testResult.value = { success: false, message: errorMsg }
    }
  } catch (err: any) {
    console.error('Connection test error:', err)
    testResult.value = {
      success: false,
      message: `Nelze se připojit k serveru na portu ${config.port}.`,
    }
  } finally {
    testing.value = false
  }
}

function getPendingText(count: number) {
  if(count == 0 )return "Vše je synchronizováno"
  if(count === 1) return "Jedna položka k synchronizaci"
  if(count >=2 && count<=4) return `${count} položky k synchronizaci`
  else return `${count} položek k synchronizaci`
}
async function testDbConnection() {
  dbTesting.value = true
  dbTestResult.value = null
  testResult.value = null
  try {
    const success = await storageService.checkDbConnection()
    if (success) {
      dbTestResult.value = {
        success: true,
        message: 'Spojení s databází bylo úspěšně navázáno.',
      }
    } else {
      dbTestResult.value = {
        success: false,
        message: 'Nepodařilo se navázat spojení s databází. Jste v offline režimu.',
      }
    }
  } catch {
    dbTestResult.value = {
      success: false,
      message: 'Chyba při testování spojení s databází.',
    }
  } finally {
    dbTesting.value = false
  }
}
</script>
<style>
.syncing-animation {
  animation: sync-spin 2s linear infinite;
}

@keyframes sync-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>