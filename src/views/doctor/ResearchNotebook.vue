<template>
  <div class="container-fluid py-4">
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="text-primary mb-1">
          <i class="bi bi-journal-bookmark me-2"></i>Research Notebook
        </h2>
        <p class="text-muted mb-3">
          Enter a topic to gather web sources and synthesize a comprehensive report using AI.
        </p>

        <div v-if="!tavilyConfigured" class="alert alert-warning">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Tavily API key not configured. Set VITE_TAVILY_API_KEY in .env to enable web search.
        </div>

        <!-- Translation Model Status -->
        <div class="mb-3">
          <button 
            v-if="!translationReady" 
            class="btn btn-sm btn-warning"
            @click="loadTranslationModel"
            :disabled="translationLoading"
          >
            <span v-if="translationLoading" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-translate me-2"></i>
            {{ translationLoading ? `Loading... ${Math.round(translationProgress)}%` : 'Load Translation Model (WebGPU)' }}
          </button>
          <span v-else class="badge bg-success me-2">
            <i class="bi bi-check-circle me-1"></i> Translation ready
          </span>
          <button 
            v-if="translationReady && reportContent && !translatedReport"
            class="btn btn-sm btn-info"
            @click="translateToCzech"
            :disabled="translating"
          >
            <span v-if="translating" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-translate me-2"></i>
            Translate to Czech
          </button>
        </div>

        <div class="input-group">
          <input 
            type="text" 
            class="form-control form-control-lg"
            v-model="searchQuery" 
            placeholder="e.g., diabetes treatment in Czech Republic"
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
            {{ isLoading ? 'Searching...' : 'Start Research' }}
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Left Pane: Sources -->
      <div class="col-md-4 mb-4 mb-md-0">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-light">
            <h5 class="mb-0"><i class="bi bi-link-45deg me-2"></i>Sources</h5>
          </div>
          <div class="card-body overflow-auto" style="max-height: 600px;">
            <div v-if="sources.length === 0 && !isLoading" class="text-muted text-center py-5">
              <i class="bi bi-globe display-4 mb-3"></i>
              <p>Enter a topic and click Start Research to gather web sources.</p>
            </div>
            <div v-if="isLoading && sources.length === 0" class="text-center py-5">
              <div class="spinner-border text-primary mb-2"></div>
              <p class="text-muted">Searching the web...</p>
            </div>
            <div v-for="(source, index) in sources" :key="index" class="mb-3 p-3 bg-light rounded">
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

      <!-- Right Pane: Report -->
      <div class="col-md-8">
        <div class="card shadow-sm h-100 d-flex flex-column">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi bi-file-text me-2"></i>Synthesis Report
              <span v-if="translatedReport" class="badge bg-info ms-2">Czech</span>
            </h5>
            <div v-if="reportContent" class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="exportPDF" :disabled="isExporting">
                <span v-if="isExporting" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-file-pdf me-1"></i>
                Export
              </button>
            </div>
          </div>
          <div class="card-body flex-grow-1 overflow-auto" style="max-height: 500px;">
            <div v-if="!reportContent && !isSynthesizing" class="text-muted text-center py-5">
              <i class="bi bi-robot display-4 mb-3"></i>
              <p>AI report will appear here after sources are found.</p>
            </div>
            <div v-if="isSynthesizing" class="text-center py-4">
              <div class="spinner-border text-primary mb-2"></div>
              <p class="text-muted">Synthesizing report using AI...</p>
            </div>
            <!-- Show translated report if available, otherwise show original -->
            <div v-if="translatedReport" class="report-content" v-html="translatedReport"></div>
            <div v-else-if="reportContent" class="report-content" v-html="formattedReport"></div>
          </div>
          <!-- Chat Input -->
          <div class="card-footer bg-white border-top-0">
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                v-model="chatInput" 
                placeholder="Ask follow-up questions..."
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
            <!-- Chat History -->
            <div v-if="chatHistory.length > 0" class="mt-3 small overflow-auto" style="max-height: 150px;">
              <div v-for="(msg, idx) in chatHistory" :key="idx" class="mb-2 p-2 rounded" :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-light'">
                <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong>
                <span class="ms-2" v-html="msg.content"></span>
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
import { searchWeb, isTavilyConfigured, type TavilyResult } from '@/services/tavilyApi'
import { useTranslation } from '@/composables/useTranslation'

const searchQuery = ref('')
const isLoading = ref(false)
const sources = ref<TavilyResult[]>([])

const reportContent = ref('')
const isSynthesizing = ref(false)
const formattedReport = ref('')

// Translation state
const translating = ref(false)
const translatedReport = ref('')
const { isLoading: translationLoading, isReady: translationReady, downloadProgress: translationProgress, loadModel: loadTranslationModel, translateToCzech: translateToCzechModel } = useTranslation()

const chatInput = ref('')
const isChatting = ref(false)
const chatHistory = ref<{ role: string; content: string }[]>([])

const isExporting = ref(false)

const tavilyConfigured = computed(() => isTavilyConfigured())

const truncate = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function startResearch() {
  if (!searchQuery.value.trim() || isLoading.value || !tavilyConfigured.value) return

  isLoading.value = true
  sources.value = []
  reportContent.value = ''
  formattedReport.value = ''
  translatedReport.value = ''
  chatHistory.value = []

  try {
    const results = await searchWeb(searchQuery.value, 5)
    sources.value = results

    if (results.length > 0) {
      await synthesizeReport(results)
    }
  } catch (error: any) {
    console.error('[ResearchNotebook] Search error:', error)
    alert(`Search failed: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

async function synthesizeReport(results: TavilyResult[]) {
  isSynthesizing.value = true

  try {
    // Use OMLX directly for synthesis
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
            content: `Based on the following web sources, write a comprehensive research report.\n\nSources:\n${sourcesText}\n\nTopic: ${searchQuery.value}\n\nProvide a well-structured report with Introduction, Key Findings, and Summary sections.` 
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    })

    if (response.ok) {
      const data = await response.json()
      reportContent.value = data.choices?.[0]?.message?.content || 'Unable to generate report.'
    } else {
      reportContent.value = 'AI service unavailable. Please check OMLX configuration.'
    }
    
    formattedReport.value = reportContent.value
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|p])/gm, '<p>')
      .replace(/$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[h二三])/g, '$1')
      .replace(/(<\/h[23]>)<\/p>/g, '$1')
  } catch (error: any) {
    console.error('[ResearchNotebook] Synthesis error:', error)
    reportContent.value = `Report generation failed: ${error.message}`
    formattedReport.value = reportContent.value
  } finally {
    isSynthesizing.value = false
  }
}

async function sendChatMessage() {
  if (!chatInput.value.trim() || isChatting.value || !reportContent.value) return

  const userQuestion = chatInput.value.trim()
  chatInput.value = ''
  isChatting.value = true

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
          { role: 'system', content: 'You are a research assistant. Answer questions based on the provided sources.' },
          { 
            role: 'user', 
            content: `Sources:\n${context}\n\nConversation:\n${chatContext}\n\nUser's question: ${userQuestion}` 
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (response.ok) {
      const data = await response.json()
      chatHistory.value.push({ role: 'assistant', content: data.choices?.[0]?.message?.content || 'Unable to answer.' })
    } else {
      chatHistory.value.push({ role: 'assistant', content: 'AI service unavailable.' })
    }
  } catch (error: any) {
    chatHistory.value.push({ role: 'assistant', content: `Error: ${error.message}` })
  } finally {
    isChatting.value = false
  }
}

async function translateToCzech() {
  if (!reportContent.value || !translationReady.value || translating.value) return

  translating.value = true

  try {
    // Translate the report using WebGPU model
    const translator = await import('@/services/Translator').then(m => m.default.getInstance())
    await translator.init()
    
    const translated = await translator.translate(reportContent.value, 'en', 'cs')
    translatedReport.value = translated
      
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|p])/gm, '<p>')
      .replace(/$/gm, '</p>')
      .replace(/<p><\/p>/g, '')
  } catch (error: any) {
    console.error('[ResearchNotebook] Translation error:', error)
    alert(`Translation failed: ${error.message}`)
  } finally {
    translating.value = false
  }
}

async function exportPDF() {
  if (!reportContent.value || isExporting.value) return

  isExporting.value = true

  try {
    const content = translatedReport.value || reportContent.value
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error('[ResearchNotebook] Export error:', error)
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.report-content :deep(h2) {
  color: #2c5282;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.report-content :deep(h3) {
  color: #4a5568;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.report-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}
</style>