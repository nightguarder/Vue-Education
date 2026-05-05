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
                  {{ testing ? 'Testování...' : 'Test připojení' }}
                </button>
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

const OMLX_API_URL_KEY = 'omlx_url'
const OMLX_MODEL_KEY = 'omlx_model'
const OMLX_TRANSLATION_MODEL_KEY = 'omlx_model_translation'
const OMLX_API_KEY_KEY = 'omlx_api_key'
const OMLX_TRANSCRIPT_MODEL_KEY = 'omlx_transcript_model'

const showApiKey = ref(false)
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
const testResult = ref<{ success: boolean; message: string } | null>(null)

function saveSettings() {
  const url = `http://127.0.0.1:${config.port}/v1/chat/completions`
  localStorage.setItem(OMLX_API_URL_KEY, url)
  localStorage.setItem(OMLX_MODEL_KEY, config.model)
  localStorage.setItem(OMLX_TRANSLATION_MODEL_KEY, config.transModel)
  localStorage.setItem(OMLX_API_KEY_KEY, config.apiKey)
  localStorage.setItem(OMLX_TRANSCRIPT_MODEL_KEY, config.transcriptModel)

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
</script>
