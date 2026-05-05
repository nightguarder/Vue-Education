<template>
  <div class="research-notebook">
    <!-- Print Modal -->
    <div class="modal fade" id="printModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-fullscreen-md-down">
        <div class="modal-content">
          <div class="modal-header no-print">
            <h5 class="modal-title">Náhled tisku</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body p-0">
            <div class="print-preview">
              <div class="worksheet-container" ref="worksheetRef">
                <!-- Worksheet Header -->
                <div class="worksheet-header">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h4 class="worksheet-title">Výzkumný materiál</h4>
                      <p class="mb-0 text-muted">{{ searchQuery }}</p>
                    </div>
                    <div class="text-end">
                      <small class="text-muted">{{ new Date().toLocaleDateString('cs-CZ') }}</small>
                    </div>
                  </div>
                  <hr />
                </div>
                <!-- Worksheet Content -->
                <div class="worksheet-content">
                  <div class="row">
                    <!-- Left Column: Key Findings + Clinical Implications -->
                    <div class="col-md-5">
                      <div class="mb-4">
                        <h6 class="section-title">Klíčová zjištění</h6>
                        <div class="section-content" v-html="formattedReport.keyFindings"></div>
                      </div>
                      <div class="mb-4">
                        <h6 class="section-title">Klinické implikace</h6>
                        <div
                          class="section-content"
                          v-html="formattedReport.clinicalImplications"
                        ></div>
                      </div>
                    </div>
                    <!-- Right Column: Summary -->
                    <div class="col-md-7">
                      <div class="mb-4">
                        <h6 class="section-title">Podrobné shrnutí</h6>
                        <div class="section-content" v-html="formattedReport.summary"></div>
                      </div>
                    </div>
                  </div>
                  <!-- Sources -->
                  <div class="sources-section mt-4">
                    <h6 class="section-title">Zdroje</h6>
                    <ul class="small sources-list">
                      <li v-for="(source, idx) in sources" :key="idx">
                        <a :href="source.url" target="_blank">{{ source.title || source.url }}</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer no-print">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zavřít</button>
            <button type="button" class="btn btn-primary" @click="printWorksheet">
              <i class="bi bi-printer me-2"></i>Tisknout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="text-primary mb-1">
            <i class="bi bi-journal-bookmark me-2"></i>Výzkumný sešit
          </h2>
          <p class="text-muted mb-3">
            Zadejte téma pro sběr webových zdrojů a syntézu komplexní zprávy pomocí AI.
          </p>

          <!-- Model Status -->
          <div class="mb-3 d-flex align-items-center gap-3 flex-wrap">
            <button
              v-if="!translationReady"
              class="btn btn-sm btn-warning"
              @click="loadTranslationModel"
              :disabled="translationLoading"
            >
              <span v-if="translationLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-translate me-2"></i>
              {{
                translationLoading
                  ? `Načítání... ${Math.round(translationProgress)}%`
                  : 'Načíst překladový model (WebGPU)'
              }}
            </button>
            <span v-if="translationReady" class="badge bg-success">
              <i class="bi bi-check-circle me-1"></i> Překlad připraven
            </span>
            <button
              v-if="translationReady && reportContent && !translatedReport"
              class="btn btn-sm btn-info"
              @click="translateToCzech"
              :disabled="translating"
            >
              <span v-if="translating" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-translate me-2"></i>
              Přeložit do češtiny
            </button>

            <!-- TTS Model -->
            <button
              v-if="!ttsReady"
              class="btn btn-sm btn-warning"
              @click="init(selectedVoice)"
              :disabled="ttsLoading || !selectedVoice"
            >
              <span v-if="ttsLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-volume-up me-2"></i>
              {{
                ttsLoading
                  ? `Načítání TTS... ${Math.round(ttsProgress)}%`
                  : 'Načíst TTS model (WebGPU)'
              }}
            </button>
            <span v-if="ttsReady" class="badge bg-success">
              <i class="bi bi-check-circle me-1"></i> TTS připraven
            </span>
          </div>

          <div class="input-group">
            <input
              type="text"
              class="form-control form-control-lg"
              v-model="searchQuery"
              placeholder="např. léčba diabetu v České republice"
              @keyup.enter="startResearch"
              :disabled="isLoading || !tavilyConfigured"
            />
            <button
              class="btn btn-primary btn-lg"
              @click="startResearch"
              :disabled="isLoading || !searchQuery.trim() || !tavilyConfigured"
            >
              <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-search me-2"></i>
              {{ isLoading ? 'Hledání...' : 'Zahájit výzkum' }}
            </button>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Left Pane: Sources -->
        <div class="col-md-4 mb-4 mb-md-0">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-light">
              <h5 class="mb-0"><i class="bi bi-link-45deg me-2"></i>Zdroje</h5>
            </div>
            <div class="card-body overflow-auto" style="max-height: 600px">
              <div v-if="sources.length === 0 && !isLoading" class="text-muted text-center py-5">
                <i class="bi bi-globe display-4 mb-3"></i>
                <p>Zadejte téma a klikněte na Zahájit výzkum pro sběr webových zdrojů.</p>
              </div>
              <div v-if="isLoading && sources.length === 0" class="text-center py-5">
                <div class="spinner-border text-primary mb-2"></div>
                <p class="text-muted">Prohledávám web...</p>
              </div>
              <div
                v-for="(source, index) in sources"
                :key="index"
                class="mb-3 p-3 bg-light rounded"
              >
                <h6 class="mb-1">
                  <a :href="source.url" target="_blank" class="text-decoration-none">
                    {{ source.title || source.url }}
                    <i class="bi bi-box-arrow-up-right ms-1 small"></i>
                  </a>
                </h6>
                <p class="small text-muted mb-0">{{ truncate(source.content, 200) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Pane: Report + Chat -->
        <div class="col-md-8">
          <div class="card shadow-sm h-100 d-flex flex-column">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <h5 class="mb-0"><i class="bi bi-file-text me-2"></i>Zpráva o syntéze</h5>
                <span v-if="translatedReport" class="badge bg-info">Česky</span>
              </div>
              <div v-if="reportContent" class="d-flex gap-2">
                <!-- TTS Controls -->
                <select
                  v-model="selectedVoice"
                  class="form-select form-select-sm"
                  style="width: auto"
                >
                  <option value="">Hlas</option>
                  <option value="cs_CZ-jirka-medium">Jirka</option>
                  <option value="cs_CZ-thomcles-high">Thomacles</option>
                </select>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click="speakReport"
                  :disabled="!selectedVoice || isSpeaking || ttsLoading"
                  :title="ttsLoading ? 'Načítání modelu...' : ''"
                >
                  <span v-if="isSpeaking" class="spinner-border spinner-border-sm"></span>
                  <span v-else-if="ttsLoading" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-play-fill"></i>
                </button>
                <button
                  v-if="isSpeaking"
                  class="btn btn-sm btn-outline-danger"
                  @click="stop"
                  title="Zastavit přehrávání"
                >
                  <i class="bi bi-stop-fill"></i>
                </button>
                <!-- Print Modal -->
                <button class="btn btn-sm btn-outline-secondary" @click="showPrintModal">
                  <i class="bi bi-printer me-1"></i>Tisk
                </button>
              </div>
            </div>
            <div class="card-body flex-grow-1 overflow-auto" style="max-height: 500px">
              <div v-if="!reportContent && !isSynthesizing" class="text-muted text-center py-5">
                <i class="bi bi-robot display-4 mb-3"></i>
                <p>AI zpráva se zde objeví po nalezení zdrojů.</p>
              </div>
              <div v-if="isSynthesizing" class="text-center py-4">
                <div class="spinner-border text-primary mb-2"></div>
                <p class="text-muted">Syntetizuji zprávu pomocí AI...</p>
              </div>

              <!-- Report Display with Markdown -->
              <div v-if="sanitizedReport" class="report-content" v-html="renderedReport"></div>

              <!-- Streaming Response -->
              <div v-if="isSynthesizing && streamingContent" class="报告-content">
                <div v-html="renderStreamingContent"></div>
                <span class="blinking-cursor">|</span>
              </div>
            </div>

            <!-- Refine Buttons -->
            <div v-if="reportContent && !isSynthesizing" class="card-footer bg-light border-top-0">
              <div class="d-flex flex-wrap gap-2 mb-2">
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="refineSection('keyFindings')"
                  :disabled="isRefining"
                >
                  <i class="bi bi-pencil me-1"></i>Upravit klíčová zjištění
                </button>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="refineSection('clinicalImplications')"
                  :disabled="isRefining"
                >
                  <i class="bi bi-pencil me-1"></i>Upravit klinické implikace
                </button>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="refineSection('summary')"
                  :disabled="isRefining"
                >
                  <i class="bi bi-pencil me-1"></i>Přepsat shrnutí
                </button>
              </div>
              <div v-if="refiningSection" class="mb-2 small text-muted">
                Upravuji: <strong>{{ refiningSection }}</strong>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="card-footer bg-white border-top-0">
              <div class="input-group">
                <input
                  type="text"
                  class="form-control"
                  v-model="chatInput"
                  placeholder="Položte doplňující otázky..."
                  :disabled="!reportContent || isChatting"
                  @keyup.enter="sendChatMessage"
                />
                <button
                  class="btn btn-secondary"
                  @click="sendChatMessage"
                  :disabled="!reportContent || isChatting || !chatInput.trim()"
                >
                  <span v-if="isChatting" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-send"></i>
                </button>
              </div>
              <!-- Chat History with message bubbles -->
              <div
                v-if="chatHistory.length > 0"
                class="mt-3 chat-messages overflow-auto"
                style="max-height: 200px"
              >
                <div v-for="(msg, idx) in chatHistory" :key="idx" class="mb-3">
                  <div class="message-wrapper" :class="msg.role === 'user' ? 'user-msg' : 'ai-msg'">
                    <div class="message-meta mb-1 px-2">
                      <span class="fw-bold small">{{ msg.role === 'user' ? 'Vy' : 'AI' }}</span>
                    </div>
                    <div class="message-bubble shadow-sm p-2 px-3">
                      <div
                        class="content small"
                        style="white-space: pre-wrap"
                        v-html="formatMessage(msg.content)"
                      ></div>
                    </div>
                  </div>
                </div>
                <!-- Streaming chat -->
                <div v-if="isChatting && streamingChatContent" class="mb-3">
                  <div class="message-wrapper ai-msg">
                    <div class="message-meta mb-1 px-2">
                      <span class="fw-bold small">AI</span>
                      <span class="ms-2 opacity-50">
                        <span
                          class="spinner-border spinner-border-sm"
                          style="width: 0.7rem; height: 0.7rem"
                        ></span>
                      </span>
                    </div>
                    <div class="message-bubble shadow-sm p-2 px-3">
                      <div class="content small" style="white-space: pre-wrap">
                        {{ streamingChatContent }}<span class="blinking-cursor">|</span>
                      </div>
                    </div>
                  </div>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { searchWeb, isTavilyConfigured, type TavilyResult } from '@/services/tavilyApi'
import { useTranslation } from '@/composables/useTranslation'
import { useTextToSpeech } from '@/composables/useTextToSpeech'
import { getRefineSectionPrompt, RESEARCH_SUMMARY_PROMPT } from '@/services/aiPrompts'

interface FormattedReport {
  keyFindings: string
  clinicalImplications: string
  summary: string
}

const searchQuery = ref('')
const isLoading = ref(false)
const sources = ref<TavilyResult[]>([])

const reportContent = ref('')
const formattedReport = ref<FormattedReport>({
  keyFindings: '',
  clinicalImplications: '',
  summary: ''
})
const isSynthesizing = ref(false)
const streamingContent = ref('')

// Translation state
const translating = ref(false)
const translatedReport = ref('')
const { isLoading: translationLoading, isReady: translationReady, downloadProgress: translationProgress, loadModel: loadTranslationModel, translateToCzech: translateToCzechModel } = useTranslation()

// Chat state
const chatInput = ref('')
const isChatting = ref(false)
const chatHistory = ref<{ role: string; content: string }[]>([])
const streamingChatContent = ref('')

// Refine state
const refiningSection = ref('')
const isRefining = ref(false)

// TTS state
const { isLoading: ttsLoading, isReady: ttsReady, isSpeaking, progress: ttsProgress, error: ttsError, init, speak, stop } = useTextToSpeech()
const selectedVoice = ref('')
const worksheetRef = ref<HTMLElement | null>(null)

// Utilities
function sanitizeHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')

  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
  }

  return html
}

function formatMessage(text: string): string {
  if (!text) return ''
  return sanitizeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<br/>• $1')
}

const tavilyConfigured = computed(() => isTavilyConfigured())

const renderedReport = computed(() => {
  const content = translatedReport.value || reportContent.value
  return sanitizeHtml(renderMarkdown(content))
})

const renderStreamingContent = computed(() => {
  return sanitizeHtml(renderMarkdown(streamingContent.value))
})

const sanitizedReport = computed(() => {
  const content = translatedReport.value || reportContent.value
  return sanitizeHtml(content)
})

const truncate = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Research flow - FIXED: use streaming
async function startResearch() {
  if (!searchQuery.value.trim() || isLoading.value || !tavilyConfigured.value) return

  isLoading.value = true
  sources.value = []
  reportContent.value = ''
  formattedReport.value = { keyFindings: '', clinicalImplications: '', summary: '' }
  translatedReport.value = ''
  chatHistory.value = []
  streamingContent.value = ''

  try {
    const results = await searchWeb(searchQuery.value, 5)
    sources.value = results

    if (results.length > 0) {
      await synthesizeReportWithStreaming(results)
    }
  } catch (error: any) {
    console.error('[ResearchNotebook] Search error:', error)
    alert(`Hledání selhalo: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

// Stream report from web sources
async function synthesizeReportWithStreaming(results: TavilyResult[]) {
  isSynthesizing.value = true
  streamingContent.value = ''

  try {
    const sourcesText = results.map((s, i) =>
      `[${i + 1}] ${s.title}\nURL: ${s.url}\nContent: ${s.content}`
    ).join('\n\n')

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          {
            role: 'system',
            content: 'You are a medical research assistant. Write comprehensive research reports with proper headings and structure. Write in the same language as the user query.'
          },
          {
            role: 'user',
            content: RESEARCH_SUMMARY_PROMPT(sourcesText, searchQuery.value)
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) throw new Error(`API failed: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') break

          try {
            const data = JSON.parse(dataStr)
            const content = data.choices?.[0]?.delta?.content || ''
            streamingContent.value += content
            fullContent += content
            await nextTick()
          } catch (e) {
            // Partial JSON, skip
          }
        }
      }
    }

    reportContent.value = fullContent
    parseReportSections(fullContent)

  } catch (error: any) {
    console.error('[ResearchNotebook] Synthesis error:', error)
    reportContent.value = `Generování zprávy selhalo: ${error.message}`
  } finally {
    isSynthesizing.value = false
    streamingContent.value = ''
  }
}

function parseReportSections(content: string) {
  const lines = content.split('\n')
  const sections: Record<string, string[]> = {
    keyFindings: [],
    clinicalImplications: [],
    summary: []
  }
  let currentSection = ''

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('klíč') || lower.includes('key') || lower.includes('zjištění')) {
      currentSection = 'keyFindings'
    } else if (lower.includes('klinické') || lower.includes('clinical') || lower.includes('dopad') || lower.includes('implikace')) {
      currentSection = 'clinicalImplications'
    } else if (lower.includes('shrnutí') || lower.includes('summary') || lower.includes('úvod') || lower.includes('výsledky')) {
      currentSection = 'summary'
    } else if (currentSection && line.trim()) {
      const arr = sections[currentSection]
      if (arr) arr.push(line)
    }
  }

  formattedReport.value = {
    keyFindings: sections.keyFindings?.join('\n') || content || '',
    clinicalImplications: sections.clinicalImplications?.join('\n') || content || '',
    summary: sections.summary?.join('\n') || content || ''
  }
}

async function refineSection(section: string) {
  refiningSection.value = section
  isRefining.value = true
  chatInput.value = ''

  try {
    const currentContent = formattedReport.value[section as keyof FormattedReport]
    const instruction = 'Vylepši a přeformátuj tento obsah.'
    const refinePrompt = getRefineSectionPrompt(section, currentContent, instruction)

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          { role: 'system', content: 'You are a medical research assistant. Improve and format the given content.' },
          { role: 'user', content: refinePrompt }
        ],
        max_tokens: 1000,
        temperature: 0.6,
        stream: true
      })
    })

    if (!response.ok) throw new Error(`API failed: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let newContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') break

          try {
            const data = JSON.parse(dataStr)
            const content = data.choices?.[0]?.delta?.content || ''
            newContent += content
          } catch (e) {
            // Skip
          }
        }
      }
    }

    if (newContent) {
      formattedReport.value[section as keyof FormattedReport] = newContent
    }

  } catch (error: any) {
    console.error('[ResearchNotebook] Refine error:', error)
    alert(`Úprava selhala: ${error.message}`)
  } finally {
    isRefining.value = false
    refiningSection.value = ''
  }
}

async function sendChatMessage() {
  if (!chatInput.value.trim() || isChatting.value || !reportContent.value) return

  const userQuestion = chatInput.value.trim()
  chatInput.value = ''
  isChatting.value = true
  streamingChatContent.value = ''

  chatHistory.value.push({ role: 'user', content: userQuestion })

  try {
    const context = sources.value.map(s => `[Source] ${s.title}: ${s.content.substring(0, 300)}`).join('\n')
    const chatContext = chatHistory.value.map(m => `${m.role}: ${m.content}`).join('\n')

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          { role: 'system', content: 'You are a research assistant. Answer questions based on the provided sources. Reply in Czech.' },
          {
            role: 'user',
            content: `Sources:\n${context}\n\nConversation:\n${chatContext}\n\nUser's question: ${userQuestion}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) throw new Error(`API failed: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') break

          try {
            const data = JSON.parse(dataStr)
            const content = data.choices?.[0]?.delta?.content || ''
            streamingChatContent.value += content
            fullResponse += content
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    if (fullResponse.trim()) {
      chatHistory.value.push({ role: 'assistant', content: fullResponse.trim() })
    } else {
      chatHistory.value.push({ role: 'assistant', content: 'Nelze odpovědět.' })
    }

  } catch (error: any) {
    console.error('[Chat] Chat error:', error)
    chatHistory.value.push({ role: 'assistant', content: `Chyba: ${error.message}` })
  } finally {
    isChatting.value = false
    streamingChatContent.value = ''
  }
}

async function translateToCzech() {
  if (!reportContent.value || !translationReady.value || translating.value) return

  translating.value = true

  try {
    const translator = await import('@/services/Translator').then(m => m.default.getInstance())
    await translator.init()

    const translated = await translator.translate(reportContent.value, 'en', 'cs')
    translatedReport.value = translated
  } catch (error: any) {
    console.error('[ResearchNotebook] Translation error:', error)
    alert(`Překlad selhal: ${error.message}`)
  } finally {
    translating.value = false
  }
}

async function speakReport() {
  if (!selectedVoice.value || isSpeaking.value) return

  const text = translatedReport.value || reportContent.value
  if (!text) return

  // Initialize model if not already ready
  if (!ttsReady.value) {
    const initialized = await init(selectedVoice.value)
    if (!initialized) {
      alert('Failed to initialize TTS model')
      return
    }
  }

  await speak(text)
}

function showPrintModal() {
  const modal = document.getElementById('printModal')
  if (modal) {
    const bsModal = new (window as any).bootstrap.Modal(modal)
    bsModal.show()
  }
}

function printWorksheet() {
  window.print()
}

onMounted(async () => {
  // TTS model will be loaded on demand
})
</script>

<style scoped lang="scss">
.report-content {
  :deep(h2) {
    color: #2c5282;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
  }
  :deep(h3) {
    color: #4a5568;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }
  :deep(h4) {
    color: #4a5568;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }
  :deep(p) {
    margin-bottom: 0.5rem;
    line-height: 1.6;
  }
  :deep(ul) {
    margin-bottom: 0.5rem;
    padding-left: 1.25rem;
  }
  :deep(li) {
    margin-bottom: 0.25rem;
  }
  :deep(strong) {
    color: #2d3748;
  }
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.user-msg {
  align-items: flex-end;
  margin-left: auto;
}

.ai-msg {
  align-items: flex-start;
}

.message-bubble {
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.user-msg .message-bubble {
  background-color: var(--bs-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-msg .message-bubble {
  background-color: white;
  color: #2d3748;
  border-bottom-left-radius: 4px;
  border: 1px solid #edf2f7;
}

.blinking-cursor {
  animation: blink 1s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.print-preview {
  background: #e0e0e0;
  padding: 20px;
  min-height: 100vh;
}

.worksheet-container {
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 15mm;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.worksheet-title {
  color: var(--bs-primary);
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.section-title {
  color: #2c5282;
  font-weight: 600;
  border-bottom: 2px solid var(--bs-primary);
  padding-bottom: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-content {
  font-size: 0.85rem;
  line-height: 1.6;
}

.sources-list {
  list-style: none;
  padding-left: 0;

  li {
    margin-bottom: 0.25rem;
    text-indent: -0.5rem;
    padding-left: 0.5rem;
  }

  a {
    color: var(--bs-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media print {
  .no-print,
  .card-header,
  .card-footer,
  .modal-header,
  .modal-footer {
    display: none !important;
  }

  .print-preview {
    background: white;
    padding: 0;
  }

  .worksheet-container {
    width: 100%;
    box-shadow: none;
    padding: 10mm;
  }
}
</style>