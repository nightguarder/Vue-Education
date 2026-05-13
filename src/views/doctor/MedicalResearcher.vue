<template>
  <div class="medical-researcher container-fluid py-4">
    <!-- Header -->
    <div class="row mb-4">
      <div class="col-12">
        <h2 class="text-primary mb-1 fw-bold">
          <i class="bi bi-robot me-2"></i>Medical Researcher
        </h2>
        <p class="text-muted">
          Unified intelligence platform: Search PubMed & Web, synthesize findings, and generate clinical Deep Dives.
        </p>

        <!-- Model Status & Configuration -->
        <div class="d-flex flex-wrap gap-3 align-items-center mb-4 p-3 bg-light rounded-4 border">
          <div class="d-flex align-items-center">
             <span v-if="translationReady" class="badge bg-success rounded-pill px-3 py-2">
              <i class="bi bi-check-circle me-1"></i> Překlad připraven
            </span>
            <button v-else class="btn btn-sm btn-warning rounded-pill px-3" @click="loadTranslationModel" :disabled="translationLoading">
              <span v-if="translationLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-translate me-2"></i> {{ translationLoading ? `Načítání... ${Math.round(translationProgress)}%` : 'Načíst překlad' }}
            </button>
          </div>
          
          <div class="d-flex align-items-center">
            <span v-if="ttsReady" class="badge bg-success rounded-pill px-3 py-2">
              <i class="bi bi-check-circle me-1"></i> TTS připraven
            </span>
            <button v-else class="btn btn-sm btn-outline-primary rounded-pill px-3" @click="initTTS(selectedVoice)" :disabled="ttsLoading || !selectedVoice">
              <span v-if="ttsLoading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-volume-up me-2"></i> TTS
            </button>
          </div>

          <div class="ms-md-auto d-flex gap-2">
            <select v-model="selectedVoice" class="form-select form-select-sm rounded-pill px-3" style="width: 140px;">
              <option value="">Vybrat hlas</option>
              <option value="cs_CZ-jirka-medium">Jirka</option>
              <option value="cs_CZ-thomcles-high">Thomacles</option>
            </select>
          </div>
        </div>

        <!-- Unified Search Bar -->
        <div class="search-container mb-5">
          <div class="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
            <span class="input-group-text border-0 bg-white ps-4">
              <i class="bi bi-search text-primary"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-0 px-3"
              placeholder="Zadejte klinické téma pro PubMed a Web..."
              @keyup.enter="performUnifiedSearch"
              :disabled="isSearching"
            />
            <button
              class="btn btn-primary px-5 fw-bold"
              @click="performUnifiedSearch"
              :disabled="isSearching || !searchQuery.trim()"
            >
              <span v-if="isSearching" class="spinner-border spinner-border-sm me-2"></span>
              Prozkoumat
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4 flex-row-reverse">
      <!-- Right Panel: Discovery Sidebar -->
      <div :class="activeDeepDive ? 'col-lg-3' : 'col-lg-4'">
        <div class="sticky-top discovery-sidebar-container" style="top: 20px;">
          <ul class="nav nav-pills mb-4 bg-white p-2 rounded-pill shadow-sm d-inline-flex w-100 border">
            <li class="nav-item flex-fill text-center">
              <button class="nav-link rounded-pill w-100" :class="{ active: activeTab === 'pubmed' }" @click="activeTab = 'pubmed'">
                PubMed
              </button>
            </li>
            <li class="nav-item flex-fill text-center">
              <button class="nav-link rounded-pill w-100" :class="{ active: activeTab === 'web' }" @click="activeTab = 'web'">
                Web
              </button>
            </li>
            <li class="nav-item flex-fill text-center">
              <button class="nav-link rounded-pill w-100" :class="{ active: activeTab === 'workspace' }" @click="activeTab = 'workspace'">
                <i class="bi bi-briefcase me-1"></i>({{ workspaceItems.length }})
              </button>
            </li>
          </ul>

          <div class="results-sidebar overflow-auto pe-1" style="max-height: calc(100vh - 300px);">
            <!-- PubMed Tab -->
            <div v-if="activeTab === 'pubmed'" class="tab-pane fade show active">
              <div v-if="isSearching" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
              </div>
              <div v-else-if="articles.length === 0" class="text-center py-5 bg-white rounded-4 shadow-sm border">
                <p class="text-muted">Žádné PubMed články</p>
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <div v-for="article in articles" :key="article.pmid" class="card border-0 shadow-sm rounded-4 result-card" :class="{ 'border border-primary bg-primary bg-opacity-10': activeDeepDive?.pmid === article.pmid }">
                  <div class="card-body p-3">
                    <h6 class="fw-bold mb-2" style="line-height: 1.4;">{{ truncate(article.title, 100) }}</h6>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                      <span v-if="article.isOpenAccess" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1" style="font-size: 0.65rem;">Open Access</span>
                      <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary rounded-circle" style="width: 32px; height: 32px; padding: 0;" @click="addToWorkspace(article, 'pubmed')" title="Do pracovního prostoru">
                          <i class="bi bi-plus"></i>
                        </button>
                        <button v-if="article.isOpenAccess" class="btn btn-sm btn-outline-success rounded-circle" style="width: 32px; height: 32px; padding: 0;" @click="createDeepDive(article)" :disabled="isGeneratingDeepDive === article.pmid" title="Deep Dive">
                          <i class="bi bi-lightning-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Web Tab -->
            <div v-if="activeTab === 'web'" class="tab-pane fade show active">
              <div v-if="isSearching" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <div v-for="(source, index) in webSources" :key="index" class="card border-0 shadow-sm rounded-4 result-card">
                  <div class="card-body p-3">
                    <h6 class="fw-bold mb-2">{{ truncate(source.title || source.url, 80) }}</h6>
                    <button class="btn btn-sm btn-outline-info rounded-pill px-3" @click="addToWorkspace(source, 'web')">
                      <i class="bi bi-plus me-1"></i>Přidat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Workspace Tab -->
            <div v-if="activeTab === 'workspace'" class="tab-pane fade show active">
               <div v-if="workspaceItems.length > 0" class="mb-4">
                 <button class="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm" @click="synthesizeWorkspace" :disabled="isSynthesizing">
                   <i class="bi bi-magic me-2"></i>Syntetizovat vše
                 </button>
               </div>
               <div v-for="(item, idx) in workspaceItems" :key="idx" class="p-3 bg-white rounded-4 shadow-sm mb-2 d-flex align-items-center justify-content-between border-start border-4" :class="item.type === 'pubmed' ? 'border-primary' : 'border-info'">
                 <span class="fw-bold small">{{ truncate(item.data.title, 60) }}</span>
                 <i class="bi bi-x-circle text-danger cursor-pointer fs-5" @click="removeFromWorkspace(idx)"></i>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Left Panel: Research Studio (Main Focus) -->
      <div :class="activeDeepDive ? 'col-lg-9' : 'col-lg-8'">
        <div class="card border-0 shadow-sm rounded-4 h-100 d-flex flex-column studio-card overflow-hidden" :class="{ 'border border-primary shadow-lg': activeDeepDive }">
          <div class="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 class="fw-bold mb-0 text-primary"><i class="bi bi-stars me-2"></i>Research Studio</h5>
            <div class="d-flex gap-2 align-items-center">
               <div class="form-check form-switch me-3" v-if="reportContent || activeDeepDive">
                 <input class="form-check-input" type="checkbox" id="showOriginalToggle" v-model="showOriginal">
                 <label class="form-check-label small text-muted" for="showOriginalToggle">Zobrazit originál (EN)</label>
               </div>
               <button v-if="activeDeepDive && !activeDeepDive.loading" class="btn btn-success rounded-pill px-4" @click="openPublishModal">
                 <i class="bi bi-send me-2"></i>Publikovat
               </button>
               <div class="d-flex gap-2" v-if="reportContent">
                 <button class="btn btn-outline-secondary rounded-pill px-3" @click="translateToCzechAction" :disabled="translating">
                   <i class="bi bi-translate me-1"></i>Přeložit
                 </button>
                 <button class="btn btn-outline-secondary rounded-pill px-3" @click="speakReport" :disabled="!ttsReady || isSpeaking">
                   <i class="bi bi-volume-up"></i>
                 </button>
               </div>
            </div>
          </div>
          
          <div class="card-body p-4 p-md-5 flex-grow-1 overflow-auto" style="max-height: 900px;">
            <!-- Loading Deep Dive -->
            <div v-if="activeDeepDive?.loading" class="text-center py-5">
               <div class="spinner-grow text-primary mb-4" style="width: 3.5rem; height: 3.5rem;"></div>
               <h3 class="fw-bold text-primary">Generuji Deep Dive...</h3>
               <p class="text-muted fs-5">Orchestruji medicínskou analýzu, blog a český překlad.</p>
               
               <div class="mt-5 text-start mx-auto" style="max-width: 400px;">
                 <div class="d-flex align-items-center mb-3 fs-5">
                   <i class="bi bi-check-circle-fill text-success me-3" v-if="deepDiveProgress > 0"></i>
                   <div class="spinner-border spinner-border-sm text-primary me-3" v-else></div>
                   <span :class="{ 'text-muted': deepDiveProgress < 0 }">Sběr vědeckých dat a obrázků</span>
                 </div>
                 <div class="d-flex align-items-center mb-3 fs-5">
                   <i class="bi bi-check-circle-fill text-success me-3" v-if="deepDiveProgress > 1"></i>
                   <div class="spinner-border spinner-border-sm text-primary me-3" v-else-if="deepDiveProgress === 1"></div>
                   <i class="bi bi-circle text-muted me-3" v-else></i>
                   <span :class="{ 'text-muted': deepDiveProgress < 1 }">Psaní odborného blogu (EN)</span>
                 </div>
                 <div class="d-flex align-items-center mb-3 fs-5">
                   <i class="bi bi-check-circle-fill text-success me-3" v-if="deepDiveProgress > 2"></i>
                   <div class="spinner-border spinner-border-sm text-primary me-3" v-else-if="deepDiveProgress === 2"></div>
                   <i class="bi bi-circle text-muted me-3" v-else></i>
                   <span :class="{ 'text-muted': deepDiveProgress < 2 }">Tvorba scénáře podcastu (EN)</span>
                 </div>
                 <div class="d-flex align-items-center fs-5">
                   <i class="bi bi-check-circle-fill text-success me-3" v-if="deepDiveProgress > 3"></i>
                   <div class="spinner-border spinner-border-sm text-primary me-2" v-else-if="deepDiveProgress === 3"></div>
                   <i class="bi bi-circle text-muted me-3" v-else></i>
                   <span :class="{ 'text-muted': deepDiveProgress < 3 }">Překlad do češtiny (Gemma-4)</span>
                 </div>
               </div>
            </div>

            <div v-else-if="!reportContent && !isSynthesizing && !activeDeepDive" class="text-center py-5 text-muted">
              <i class="bi bi-cpu display-1 opacity-10 mb-4"></i>
              <h4 class="fw-bold">Studio je připraveno</h4>
              <p>Zde se objeví výsledky vaší syntézy nebo vygenerované Deep Dive materiály.</p>
            </div>

            <!-- Synthesis Output -->
            <div v-if="isSynthesizing" class="text-center py-5">
              <div class="spinner-grow text-primary mb-4"></div>
              <h4 class="fw-bold text-primary">Syntetizuji komplexní klinickou zprávu...</h4>
              <div class="text-muted text-start mt-4 streaming-box p-4 bg-light rounded-4 shadow-inner">
                 {{ streamingContent }}<span class="blinking-cursor">|</span>
              </div>
            </div>

            <div v-if="reportContent && !activeDeepDive" class="report-container fade-in">
              <div v-if="translatedReport" class="mb-5">
                <div class="markdown-content" v-html="renderMarkdown(translatedReport)"></div>
              </div>
              <div v-if="showOriginal" class="border-top pt-5 mt-5 bg-light p-4 rounded-4 border-dashed">
                <div class="badge bg-secondary bg-opacity-10 text-secondary mb-3 px-3 py-2">Original English Reference</div>
                <div class="markdown-content small text-muted" v-html="renderMarkdown(reportContent)"></div>
              </div>
              <div v-else-if="!translatedReport" class="markdown-content" v-html="renderMarkdown(reportContent)"></div>
            </div>

            <!-- Deep Dive Output -->
            <div v-if="activeDeepDive && !activeDeepDive.loading" class="deep-dive-studio fade-in">
              <div class="d-flex align-items-center justify-content-between mb-4">
                <h4 class="fw-bold text-primary mb-0"><i class="bi bi-journal-check me-2"></i>Deep Dive: {{ activeDeepDive.title }}</h4>
                <button class="btn btn-link text-muted p-0 text-decoration-none" @click="activeDeepDive = null">Zavřít studio</button>
              </div>

              <div class="btn-group w-100 mb-5 rounded-pill overflow-hidden border shadow-sm">
                <button class="btn btn-outline-primary py-3 fw-bold" :class="{ active: studioView === 'blog' }" @click="studioView = 'blog'">Odborný Blog</button>
                <button class="btn btn-outline-primary py-3 fw-bold" :class="{ active: studioView === 'podcast' }" @click="studioView = 'podcast'">Podcast Script</button>
                <button class="btn btn-outline-primary py-3 fw-bold" :class="{ active: studioView === 'figures' }" @click="studioView = 'figures'">Figures ({{ activeDeepDive.figures?.length || 0 }})</button>
              </div>

              <!-- Deep Dive Views -->
              <div v-if="studioView === 'blog'">
                 <div v-if="activeDeepDive.blogTranslated" class="mb-5">
                    <div class="markdown-content" v-html="renderMarkdown(activeDeepDive.blogTranslated)"></div>
                 </div>
                 <div v-if="showOriginal" class="border-top pt-4 mt-4 bg-light p-4 rounded-4 border-dashed">
                    <div class="badge bg-secondary bg-opacity-10 text-secondary mb-3 px-3 py-2">Original English Reference</div>
                    <div class="markdown-content text-muted small" v-html="renderMarkdown(activeDeepDive.blog)"></div>
                 </div>
                 <div v-else-if="!activeDeepDive.blogTranslated" class="markdown-content" v-html="renderMarkdown(activeDeepDive.blog)"></div>
              </div>

              <div v-else-if="studioView === 'podcast'">
                 <div v-if="activeDeepDive.podcastTranslated" class="mb-5">
                    <div class="markdown-content" v-html="renderMarkdown(activeDeepDive.podcastTranslated)"></div>
                 </div>
                 <div v-if="showOriginal" class="border-top pt-4 mt-4 bg-light p-4 rounded-4 border-dashed">
                    <div class="badge bg-secondary bg-opacity-10 text-secondary mb-3 px-3 py-2">Original English Reference</div>
                    <div class="markdown-content text-muted small" v-html="renderMarkdown(activeDeepDive.podcast)"></div>
                 </div>
                 <div v-else-if="!activeDeepDive.podcastTranslated" class="markdown-content" v-html="renderMarkdown(activeDeepDive.podcast)"></div>
                 <button class="btn btn-primary mt-5 w-100 rounded-pill py-3 fw-bold shadow-sm" @click="generatePodcastAudio">
                   <i class="bi bi-mic me-2"></i>Generovat AI Audio Podcast
                 </button>
              </div>

              <div v-else-if="studioView === 'figures'">
                 <div v-if="!activeDeepDive.figures?.length" class="text-center py-5">
                   <p class="text-muted fs-5">Z tohoto článku se nepodařilo extrahovat žádné obrázky.</p>
                 </div>
                 <div class="row g-4">
                   <div v-for="fig in activeDeepDive.figures" :key="fig.id" class="col-12">
                     <div class="card border-0 bg-white rounded-4 shadow-sm p-3 border">
                       <img :src="fig.url" class="img-fluid rounded-3 mb-3 shadow-sm" alt="Clinical Figure">
                       <h6 class="fw-bold text-primary">{{ fig.label }}</h6>
                       <p class="text-muted mb-0" style="line-height: 1.6;">{{ fig.caption }}</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Studio Chat Interaction -->
          <div class="card-footer bg-white border-top-0 p-4">
            <div v-if="studioChatHistory.length > 0" ref="studioChatRef" class="chat-history mb-4 overflow-auto" style="max-height: 300px;">
               <div v-for="(msg, idx) in studioChatHistory" :key="idx" class="mb-3 d-flex" :class="msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'">
                  <div class="message-bubble p-3 px-4 rounded-4 shadow-sm" :class="msg.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'" style="max-width: 85%; line-height: 1.6;">
                     {{ msg.content }}
                  </div>
               </div>
               <div v-if="isChatting" class="text-muted d-flex align-items-center gap-2">
                 <div class="spinner-border spinner-border-sm text-primary"></div>
                 AI zpracovává odpověď...
               </div>
            </div>
            <div class="input-group input-group-lg rounded-pill overflow-hidden border shadow-sm">
              <input v-model="studioChatInput" type="text" class="form-control border-0 px-4" placeholder="Zeptejte se na doplňující detaily k výzkumu..." :disabled="!reportContent && !activeDeepDive" @keyup.enter="sendStudioChat">
              <button class="btn btn-primary px-4" @click="sendStudioChat" :disabled="!studioChatInput.trim() || isChatting">
                <i class="bi bi-send-fill" v-if="!isChatting"></i>
                <span v-else class="spinner-border spinner-border-sm"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Publish Review Modal -->
    <BModal
      v-model="showPublishModal"
      title="Kontrola před publikací"
      size="xl"
      scrollable
      ok-title="Publikovat nyní"
      cancel-title="Zrušit"
      @ok="confirmPublish"
      header-bg-variant="primary"
      header-text-variant="white"
      footer-class="p-3"
    >
      <div class="row">
        <!-- Edit Column -->
        <div class="col-md-6 border-end">
          <h6 class="fw-bold mb-3"><i class="bi bi-pencil me-2"></i>Upravit text</h6>
          <div class="mb-3">
            <label class="form-label small fw-bold">Název článku</label>
            <input v-model="editPost.title" type="text" class="form-control form-control-lg rounded-3">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Obsah (Markdown podpora)</label>
            <textarea v-model="editPost.content" class="form-control rounded-3" rows="20" style="font-family: monospace; font-size: 0.9rem;"></textarea>
          </div>
        </div>
        
        <!-- Preview Column -->
        <div class="col-md-6 bg-light bg-opacity-50">
          <h6 class="fw-bold mb-3"><i class="bi bi-eye me-2"></i>Náhled pro pacienta</h6>
          <div class="patient-preview bg-white p-4 rounded-4 shadow-sm border" style="min-height: 500px;">
            <h2 class="fw-bold mb-4">{{ editPost.title }}</h2>
            <div class="markdown-content" v-html="renderMarkdown(editPost.content)"></div>
            
            <div v-if="editPost.figures.length > 0" class="mt-5 border-top pt-4">
               <div class="badge bg-primary mb-3">Obrázky zahrnuty ({{ editPost.figures.length }})</div>
               <div class="row g-2">
                 <div v-for="fig in editPost.figures" :key="fig.id" class="col-4">
                   <img :src="fig.url" class="img-fluid rounded border shadow-xs" style="height: 80px; object-fit: cover;">
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { searchMedicalLiterature, formatAuthors, fetchArticleFigures, type PubMedArticle, type PubMedFigure } from '@/services/pubmedApi'
import { searchWeb, type TavilyResult } from '@/services/tavilyApi'
import { useTranslation } from '@/composables/useTranslation'
import { useTextToSpeech } from '@/composables/useTextToSpeech'
import { 
  BLOG_POST_PROMPT, 
  PODCAST_SCRIPT_PROMPT, 
  RESEARCH_SUMMARY_PROMPT, 
} from '@/services/aiPrompts'
import { fetchChatCompletion, streamChatCompletion, type ChatMessage as OmlxMessage } from '@/services/omlxApi'
import { storageService } from '@/services/storageService'
import { doctorApi } from '@/services/doctorApi'
import { marked } from 'marked'

const DRAFT_KEY = 'blog_draft'

// State
const searchQuery = ref('')
const activeTab = ref('pubmed')
const isSearching = ref(false)
const articles = ref<PubMedArticle[]>([])
const webSources = ref<TavilyResult[]>([])
const workspaceItems = ref<{ type: 'pubmed' | 'web', data: any }[]>([])

// Studio State
const reportContent = ref('')
const translatedReport = ref('')
const isSynthesizing = ref(false)
const streamingContent = ref('')
const activeDeepDive = ref<any>(null)
const studioView = ref<'blog' | 'podcast' | 'figures'>('blog')
const studioChatInput = ref('')
const studioChatHistory = ref<{ role: 'user' | 'assistant', content: string }[]>([])
const isChatting = ref(false)
const studioChatRef = ref<HTMLElement | null>(null)
const showOriginal = ref(false)

// Publish Modal State
const showPublishModal = ref(false)
const editPost = reactive({
  title: '',
  content: '',
  figures: [] as any[]
})

// Component States
const articleSummaries = reactive<Record<string, string>>({})
const summarizingId = ref<string | null>(null)
const translating = ref(false)
const isGeneratingDeepDive = ref<string | null>(null)
const deepDiveProgress = ref(0)

// Services
const { 
  isLoading: translationLoading, 
  isReady: translationReady, 
  downloadProgress: translationProgress, 
  loadModel: loadTranslationModel, 
  translateToCzech 
} = useTranslation()

const { 
  isLoading: ttsLoading, 
  isReady: ttsReady, 
  isSpeaking, 
  progress: ttsProgress, 
  init: initTTS, 
  speak, 
  stop 
} = useTextToSpeech()

const selectedVoice = ref('cs_CZ-jirka-medium')

// --- Actions ---

async function performUnifiedSearch() {
  if (!searchQuery.value.trim() || isSearching.value) return
  
  isSearching.value = true
  articles.value = []
  webSources.value = []
  
  try {
    const [pubmedResults, webRes] = await Promise.all([
      searchMedicalLiterature(searchQuery.value, 1),
      searchWeb(searchQuery.value, 6)
    ])
    
    articles.value = pubmedResults.articles
    webSources.value = webRes.results
    
    if (articles.value.length > 0) activeTab.value = 'pubmed'
    else if (webSources.value.length > 0) activeTab.value = 'web'
    
  } catch (err) {
    console.error('Unified search failed:', err)
  } finally {
    isSearching.value = false
  }
}

function addToWorkspace(data: any, type: 'pubmed' | 'web') {
  workspaceItems.value.push({ type, data })
}

function removeFromWorkspace(index: number) {
  workspaceItems.value.splice(index, 1)
}

async function synthesizeWorkspace() {
  if (workspaceItems.value.length === 0 || isSynthesizing.value) return
  
  isSynthesizing.value = true
  reportContent.value = ''
  translatedReport.value = ''
  streamingContent.value = ''
  activeDeepDive.value = null
  studioChatHistory.value = []
  
  try {
    const sourcesText = workspaceItems.value.map((item, i) => {
      const title = item.data.title || 'Untitled'
      const content = item.type === 'pubmed' ? (item.data.abstract || '') : item.data.content
      return `[Source ${i + 1}] ${title}\nContent: ${content}`
    }).join('\n\n')

    const messages: OmlxMessage[] = [
      { role: 'system', content: 'You are an expert medical research synthesizer. Create a comprehensive, structured report.' },
      { role: 'user', content: RESEARCH_SUMMARY_PROMPT(sourcesText, searchQuery.value) }
    ]

    reportContent.value = await streamChatCompletion(
      messages,
      (delta) => { 
        streamingContent.value += delta
        nextTick(scrollToBottom)
      },
      { max_tokens: 2500 }
    )
  } catch (err) {
    console.error('Synthesis failed:', err)
  } finally {
    isSynthesizing.value = false
    streamingContent.value = ''
  }
}

async function summarizeSingle(article: PubMedArticle) {
  summarizingId.value = article.pmid
  try {
    const response = await fetchChatCompletion([
      { role: 'system', content: 'You are a medical research assistant. Summarize concisely.' },
      { role: 'user', content: `Title: ${article.title}\nAbstract: ${article.abstract}` }
    ], { max_tokens: 600 })
    
    articleSummaries[article.pmid] = response
  } catch (err) {
    console.error('Summary failed:', err)
  } finally {
    summarizingId.value = null
  }
}

async function createDeepDive(article: PubMedArticle) {
  if (isGeneratingDeepDive.value) return

  activeDeepDive.value = { pmid: article.pmid, title: article.title, loading: true }
  isGeneratingDeepDive.value = article.pmid
  reportContent.value = ''
  studioView.value = 'blog'
  deepDiveProgress.value = 0
  studioChatHistory.value = []
  
  try {
    // 1. Dual Visual Search (PMC Scraper + Tavily Fallback)
    const [scrapedFigures, tavilyRes] = await Promise.all([
      article.pmc ? fetchArticleFigures(article.pmc).catch(err => {
        console.warn('[PubMed] Figure fetch failed:', err)
        return []
      }) : Promise.resolve([]),
      searchWeb(`${article.title} medical diagram chart`, 5, true).catch(err => {
        console.warn('[Tavily] Visual search failed:', err)
        return { results: [], images: [] }
      })
    ])

    const figures: PubMedFigure[] = [...scrapedFigures]
    
    // Add Tavily images as supplemental visuals
    if (tavilyRes.images) {
      tavilyRes.images.forEach((url, i) => {
        if (figures.length < 10) {
          figures.push({
            id: `web-${i}`,
            label: `Zdroj ${i + 1}`,
            caption: 'Ilustrační obrázek k tématu z webu.',
            url: url
          })
        }
      })
    }
    deepDiveProgress.value = 1

    const blogContent = await fetchChatCompletion([
      { role: 'system', content: 'You are a medical research assistant.' },
      { role: 'user', content: BLOG_POST_PROMPT(article.title, article.abstract || '') }
    ], { max_tokens: 1500 })
    deepDiveProgress.value = 2

    const podcastContent = await fetchChatCompletion([
      { role: 'system', content: 'You are a medical research assistant.' },
      { role: 'user', content: PODCAST_SCRIPT_PROMPT(article.title, article.abstract || '') }
    ], { max_tokens: 1000 })
    deepDiveProgress.value = 3

    const [blogTranslated, podcastTranslated] = await Promise.all([
      translateToCzech(blogContent),
      translateToCzech(podcastContent)
    ])
    deepDiveProgress.value = 4

    activeDeepDive.value = {
      pmid: article.pmid,
      title: article.title,
      blog: blogContent,
      blogTranslated,
      podcast: podcastContent,
      podcastTranslated,
      figures,
      loading: false
    }
    saveDraft(activeDeepDive.value)
  } catch (err) {
    console.error('Deep Dive failed:', err)
    activeDeepDive.value = null
  } finally {
    isGeneratingDeepDive.value = null
  }
}

async function sendStudioChat() {
  if (!studioChatInput.value.trim() || isChatting.value) return
  
  const userMsg = studioChatInput.value.trim()
  studioChatInput.value = ''
  studioChatHistory.value.push({ role: 'user', content: userMsg })
  isChatting.value = true
  
  await nextTick(scrollToBottom)

  try {
    const context = activeDeepDive.value 
      ? `Paper Title: ${activeDeepDive.value.title}\nBlog Content: ${activeDeepDive.value.blog}`
      : `Research Synthesis Context: ${reportContent.value}`

    const messages: OmlxMessage[] = [
      { role: 'system', content: 'You are a helpful medical research assistant. Answer the doctor\'s questions based on the provided context. Reply in Czech (čeština).' },
      { role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${userMsg}` }
    ]

    const response = await fetchChatCompletion(messages, { max_tokens: 1000 })
    studioChatHistory.value.push({ role: 'assistant', content: response })
    await nextTick(scrollToBottom)
  } catch (err) {
    console.error('Studio Chat failed:', err)
    studioChatHistory.value.push({ role: 'assistant', content: 'Omlouvám se, ale nastala chybu při generování odpovědi.' })
  } finally {
    isChatting.value = false
  }
}

function scrollToBottom() {
  if (studioChatRef.value) {
    studioChatRef.value.scrollTop = studioChatRef.value.scrollHeight
  }
}

function saveDraft(dive: any) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(dive))
}

function restoreDraft(): any | null {
  const stored = localStorage.getItem(DRAFT_KEY)
  return stored ? JSON.parse(stored) : null
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

function openPublishModal() {
  if (!activeDeepDive.value || activeDeepDive.value.loading) return
  
  editPost.title = activeDeepDive.value.title
  editPost.content = activeDeepDive.value.blogTranslated || activeDeepDive.value.blog
  editPost.figures = activeDeepDive.value.figures || []
  showPublishModal.value = true
}

function confirmPublish() {
  const blogPost = {
    id: Date.now(),
    title: editPost.title,
    content: editPost.content,
    type: 'deep-dive',
    figures: [...editPost.figures],
    date: new Date().toISOString(),
  }

  storageService.saveBlogPost(blogPost).then(() => {
    clearDraft()
    showPublishModal.value = false
    alert('Článek byl úspěšně publikován do sekce Novinky z výzkumu!')
  }).catch(() => {
    clearDraft()
    showPublishModal.value = false
    alert('Článek uložen lokálně (backend nedostupný).')
  })
}

async function translateToCzechAction() {
  if (!reportContent.value || translating.value) return
  translating.value = true
  try {
    translatedReport.value = await translateToCzech(reportContent.value)
  } catch (err) {
    console.error('Translation failed:', err)
  } finally {
    translating.value = false
  }
}

async function speakReport() {
  const text = translatedReport.value || reportContent.value || activeDeepDive.value?.blogTranslated
  if (text) await speak(text)
}

function generatePodcastAudio() {
  alert('Podcast audio generation is coming soon!')
}

function truncate(text: string, len: number) {
  if (!text) return ''
  return text.length > len ? text.substring(0, len) + '...' : text
}

function renderMarkdown(text: string) {
  return text ? marked.parse(text) : ''
}

onMounted(() => {
  const draft = restoreDraft()
  if (draft && !activeDeepDive.value) {
    activeDeepDive.value = { ...draft, loading: false }
  }
})
</script>

<style scoped lang="scss">
.medical-researcher {
  max-width: 1600px;
  margin: 0 auto;
}

.result-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0 !important;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
    background-color: #f8fafc;
  }
}

.studio-card {
  background: white;
  min-height: 800px;
  border: 1px solid #e2e8f0;
}

.streaming-box {
  border-left: 4px solid var(--bs-primary);
  line-height: 1.8;
  font-size: 1.1rem;
}

.markdown-content {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #1e293b;
  :deep(h1), :deep(h2), :deep(h3) { 
    margin-top: 2rem; 
    font-weight: 800; 
    color: var(--bs-primary); 
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 0.5rem;
  }
  :deep(p) { margin-bottom: 1.5rem; }
  :deep(ul), :deep(ol) { margin-bottom: 1.5rem; padding-left: 2rem; }
  :deep(li) { margin-bottom: 0.5rem; }
}

.blinking-cursor {
  animation: blink 1s infinite;
}

@keyframes blink { 50% { opacity: 0; } }

.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.results-sidebar {
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
}

.message-bubble {
  font-size: 1rem;
  border: 1px solid rgba(0,0,0,0.05);
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}

.border-dashed {
  border-style: dashed !important;
}

.patient-preview {
  max-height: 700px;
  overflow-y: auto;
}
</style>
