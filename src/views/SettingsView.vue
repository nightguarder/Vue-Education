<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">OMLX Settings</h4>
            <p class="card-text text-muted mb-0 small">Configure local AI service connection and models.</p>
          </div>
          <div class="card-body">
            <BAlert v-if="saveSuccess" variant="success" dismissible @dismissed="saveSuccess = false">
              Settings saved successfully!
            </BAlert>
            <BAlert v-if="testResult" :variant="testResult.success ? 'success' : 'danger'" dismissible @dismissed="testResult = null">
              {{ testResult.message }}
            </BAlert>

            <h5 class="mb-3">Connection Settings</h5>
            <BForm @submit.prevent="saveSettings">
              <BFormGroup label="OMLX Port" label-for="omlx-port" class="mb-3">
                <BFormInput
                  id="omlx-port"
                  v-model="config.port"
                  type="number"
                  placeholder="8888"
                />
                <BFormText>Port where OMLX service is running locally.</BFormText>
              </BFormGroup>

              <BFormGroup 
                label="API Key" 
                label-for="omlx-api-key" 
                class="mb-3"
                :state="isApiKeyValid"
              >
                <BInputGroup>
                  <BFormInput
                    id="omlx-api-key"
                    v-model="config.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    placeholder="Zadejte váš API klíč..."
                    :state="isApiKeyValid"
                  />
                  <template #append>
                    <BButton variant="outline-secondary" @click="showApiKey = !showApiKey">
                      <i v-if="showApiKey" class="bi bi-eye-slash"></i>
                      <i v-else class="bi bi-eye-fill"></i>
                    </BButton>
                  </template>
                </BInputGroup>
                <BFormInvalidFeedback :state="isApiKeyValid">
                  {{ apiKeyFeedback }}
                </BFormInvalidFeedback>
                <BFormText>API klíč pro autentizaci služby OMLX.</BFormText>
              </BFormGroup>

              <BFormGroup label="Výchozí model" label-for="omlx-model" class="mb-3">
                <BInputGroup>
                  <BFormSelect
                    id="omlx-model"
                    v-model="config.model"
                    :options="availableModels"
                    :disabled="loadingModels"
                  />
                  <template #append>
                    <BButton variant="outline-secondary" @click="fetchModels" :disabled="loadingModels">
                      <BSpinner v-if="loadingModels" small />
                      <i v-else class="bi bi-arrow-clockwise"></i>
                    </BButton>
                  </template>
                </BInputGroup>
                <BFormText>Model používaný pro generování textu.</BFormText>
              </BFormGroup>

              <BFormGroup label="Překladový model" label-for="omlx-trans-model" class="mb-3">
                <BInputGroup>
                  <BFormSelect
                    id="omlx-trans-model"
                    v-model="config.transModel"
                    :options="availableModels"
                    :disabled="loadingModels"
                  />
                  <template #append>
                    <BButton variant="outline-secondary" @click="fetchModels" :disabled="loadingModels">
                      <BSpinner v-if="loadingModels" small />
                      <i v-else class="bi bi-arrow-clockwise"></i>
                    </BButton>
                  </template>
                </BInputGroup>
                <BFormText>Model používaný pro překlady.</BFormText>
              </BFormGroup>

              <div class="d-flex gap-2 mb-4">
                <BButton type="submit" variant="primary">
                  <i class="bi bi-check-lg me-1"></i> Save Settings
                </BButton>
                <BButton type="button" variant="outline-secondary" @click="testConnection" :disabled="testing">
                  <BSpinner v-if="testing" small class="me-1" />
                  <i v-else class="bi bi-plug me-1"></i>
                  {{ testing ? 'Testing...' : 'Test Connection' }}
                </BButton>
              </div>

              <!-- Inline Connection Result -->
              <div v-if="testResult" class="connection-result mb-3 animate-fade-in">
                <BCard :class="['border-0 shadow-sm', testResult.success ? 'bg-success-subtle' : 'bg-danger-subtle']">
                  <div class="d-flex align-items-center">
                    <div :class="['result-icon me-3', testResult.success ? 'text-success' : 'text-danger']">
                      <i :class="testResult.success ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div :class="['fw-bold small', testResult.success ? 'text-success' : 'text-danger']">
                        {{ testResult.success ? 'Spojení navázáno' : 'Chyba připojení' }}
                      </div>
                      <div class="small text-dark opacity-75">{{ testResult.message }}</div>
                    </div>
                    <BButton size="sm" variant="link" class="text-decoration-none text-muted p-0 ms-2" @click="testResult = null">
                      <i class="bi bi-x-lg"></i>
                    </BButton>
                  </div>
                </BCard>
              </div>
            </BForm>
          </div>
        </div>
          </div>
        </div>

        <!-- Tutorial Section -->
        <div class="card shadow-sm border-0 mt-4 overflow-hidden">
          <div class="card-header bg-white border-bottom py-3">
            <h4 class="card-title mb-0">Nastavení OMLX na macOS</h4>
          </div>
          <div class="card-body p-0">
            <div class="guide-container">
              <!-- Step 1 -->
              <div class="guide-step p-4 border-bottom">
                <div class="d-flex align-items-start gap-3">
                  <div class="step-number">1</div>
                  <div class="flex-grow-1">
                    <h5>Stažení aplikace</h5>
                    <p class="text-muted">
                      Přejděte na <a href="https://github.com/jundot/omlx/releases" target="_blank">GitHub repozitář OMLX</a> 
                      a stáhněte si nejnovější verzi souboru <code>.dmg</code> pro macOS.
                    </p>
                    <div class="step-image mt-3 bg-light rounded d-flex align-items-center justify-content-center p-4">
                      <i class="bi bi-download fs-1 text-secondary opacity-50"></i>
                      <span class="ms-3 text-muted">dmg-download.png</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="guide-step p-4 border-bottom bg-light bg-opacity-25">
                <div class="d-flex align-items-start gap-3">
                  <div class="step-number">2</div>
                  <div class="flex-grow-1">
                    <h5>Instalace do aplikací</h5>
                    <p class="text-muted">
                      Otevřete stažený <code>.dmg</code> soubor a přetáhněte ikonu OMLX do složky 
                      <strong>Applications</strong> (Aplikace).
                    </p>
                    <div class="step-image mt-3 bg-white border rounded d-flex align-items-center justify-content-center p-4 shadow-sm">
                      <i class="bi bi-arrow-right-circle fs-1 text-primary"></i>
                      <span class="ms-3 text-muted">install-drag.png</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="guide-step p-4 border-bottom">
                <div class="d-flex align-items-start gap-3">
                  <div class="step-number">3</div>
                  <div class="flex-grow-1">
                    <h5>První spuštění</h5>
                    <p class="text-muted">
                      Spusťte OMLX z Launchpadu. Při prvním spuštění může macOS vyžadovat potvrzení 
                      bezpečnosti v <em>Nastavení systému > Soukromí a bezpečnost</em>.
                    </p>
                    <div class="step-image mt-3 bg-light rounded d-flex align-items-center justify-content-center p-4">
                      <i class="bi bi-shield-check fs-1 text-success"></i>
                      <span class="ms-3 text-muted">macos-security.png</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="guide-step p-4 border-bottom bg-light bg-opacity-25">
                <div class="d-flex align-items-start gap-3">
                  <div class="step-number">4</div>
                  <div class="flex-grow-1">
                    <h5>Konfigurace Localhost a API klíče</h5>
                    <p class="text-muted">
                      V aplikaci OMLX uvidíte nastavení portu (výchozí <strong>8080</strong>) 
                      a API klíč (výchozí <strong>5004</strong>). Tyto údaje zkopírujte do formuláře výše.
                    </p>
                    <div class="step-image mt-3 bg-white border rounded d-flex align-items-center justify-content-center p-4 shadow-sm">
                      <i class="bi bi-key fs-1 text-warning"></i>
                      <span class="ms-3 text-muted">omlx-config-ui.png</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 5 -->
              <div class="guide-step p-4">
                <div class="d-flex align-items-start gap-3">
                  <div class="step-number">5</div>
                  <div class="flex-grow-1">
                    <h5>Výběr modelu</h5>
                    <p class="text-muted">
                      V rozhraní OMLX si stáhněte a vyberte model (např. <code>gemma-4-e4b-it-OptiQ-4bit</code>). 
                      Jakmile se model načte, klikněte na tlačítko <strong>Test Connection</strong> v této aplikaci.
                    </p>
                    <div class="step-image mt-3 bg-light rounded d-flex align-items-center justify-content-center p-4">
                      <i class="bi bi-cpu fs-1 text-info"></i>
                      <span class="ms-3 text-muted">model-selection.png</span>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { BAlert, BButton, BForm, BFormGroup, BFormInput, BFormText, BCard, BCardBody, BSpinner, BInputGroup, BFormInvalidFeedback, BFormSelect } from 'bootstrap-vue-next'

const OMLX_API_URL_KEY = 'omlx_url'
const OMLX_MODEL_KEY = 'omlx_model'
const OMLX_TRANSLATION_MODEL_KEY = 'omlx_model_translation'
const OMLX_API_KEY_KEY = 'omlx_api_key'

const showApiKey = ref(false)
const availableModels = ref<{ value: string; text: string }[]>([
  { value: 'gemma-4-e4b-it-OptiQ-4bit', text: 'gemma-4-e4b-it-OptiQ-4bit (výchozí)' }
])
const loadingModels = ref(false)

const config = reactive({
  port: import.meta.env.VITE_OMLX_PORT || '8888',
  apiKey: import.meta.env.VITE_OMLX_API_KEY || '',
  model: 'gemma-4-e4b-it-OptiQ-4bit',
  transModel: 'gemma-4-e4b-it-OptiQ-4bit'
})

const isApiKeyValid = computed(() => config.apiKey.length >= 4)
const apiKeyFeedback = computed(() => {
  if (config.apiKey.length === 0) return 'API klíč je vyžadován.'
  if (config.apiKey.length < 4) return 'API klíč musí mít alespoň 4 znaky.'
  return ''
})

onMounted(async () => {
  // Load saved settings
  const savedUrl = localStorage.getItem(OMLX_API_URL_KEY)
  if (savedUrl) {
    const match = savedUrl.match(/:(\d+)/)
    if (match) config.port = match[1]??config.port
  }
  const savedModel = localStorage.getItem(OMLX_MODEL_KEY)
  if (savedModel) config.model = savedModel
  const savedTransModel = localStorage.getItem(OMLX_TRANSLATION_MODEL_KEY)
  if (savedTransModel) config.transModel = savedTransModel
  const savedApiKey = localStorage.getItem(OMLX_API_KEY_KEY)
  if (savedApiKey) config.apiKey = savedApiKey

  // Try to fetch models if port and API key are available
  if (config.port && config.apiKey) {
    fetchModels()
  }
})

async function fetchModels() {
  loadingModels.value = true
  try {
    const response = await fetch(`http://127.0.0.1:${config.port}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      if (data && data.data) {
        availableModels.value = data.data.map((m: any) => ({
          value: m.id,
          text: m.id
        }))
      }
    }
  } catch (err) {
    console.error('Failed to fetch models:', err)
  } finally {
    loadingModels.value = false
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
  saveSuccess.value = true
  setTimeout(() => { saveSuccess.value = false }, 3000)
}



async function testConnection() {
  testing.value = true
  testResult.value = null

  try {
    // Refresh models list as part of testing connection
    await fetchModels()
    
    const url = `http://127.0.0.1:${config.port}/v1/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'test connection' }],
        max_tokens: 1
      })
    })

    if (response.ok) {
      testResult.value = {
        success: true,
        message: 'Spojení bylo úspěšně navázáno. Služba OMLX je aktivní.'
      }
    } else {
      let errorMsg = `Kód chyby: ${response.status}`
      if (response.status === 401) {
        errorMsg = 'Neautorizovaný přístup (401). Zkontrolujte platnost vašeho API klíče.'
      } else if (response.status === 404) {
        errorMsg = 'Model nebyl nalezen (404). Zkontrolujte název modelu.'
      }
      
      testResult.value = {
        success: false,
        message: errorMsg
      }
    }
  } catch (err: any) {
    console.error('Connection test error:', err)
    testResult.value = {
      success: false,
      message: `Nelze se připojit k serveru. Ujistěte se, že OMLX běží na portu ${config.port}.`
    }
  } finally {
    testing.value = false
  }
}
</script>

<style scoped lang="scss">
.step-number {
  background-color: $primary-color;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-image {
  min-height: 200px;
  border: 1px dashed #dee2e6;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
  }
}

.guide-step {
  transition: transform 0.3s ease;
  
  &:hover {
    background-color: rgba($primary-color, 0.02) !important;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

code {
  font-size: 0.9rem;
  color: $secondary-color;
  background-color: rgba($secondary-color, 0.05);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
</style>
