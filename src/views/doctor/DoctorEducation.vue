<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10 col-lg-8">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom py-3">
            <h4 class="card-title mb-1 fw-bold">
              <i class="bi bi-search text-primary me-2"></i>Medical Literature Search
            </h4>
            <p class="card-text text-muted mb-0 small">
              Search PubMed for medical articles, get AI summaries, and translate to Czech.
            </p>
            <!-- Translation Model Loader -->
            <div class="mt-3">
              <button
                v-if="!translationReady"
                class="btn btn-sm btn-warning rounded-pill px-3 shadow-sm"
                @click="loadTranslationModel"
                :disabled="translationLoading"
              >
                <span v-if="translationLoading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-translate me-2"></i>
                {{ translationLoading ? `Loading... ${Math.round(translationProgress)}%` : 'Load Translation Model' }}
              </button>
              <span v-else class="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">
                <i class="bi bi-check-circle me-1"></i> Translation ready
              </span>
            </div>
          </div>
          <div class="card-body p-4">
            <!-- Search Form -->
            <div class="input-group mb-4 shadow-sm rounded-pill overflow-hidden border">
              <input
                v-model="searchQuery"
                type="text"
                class="form-control border-0 ps-4"
                placeholder="Search PubMed (e.g., 'cognitive behavioral therapy anxiety')"
                @keyup.enter="search"
                :disabled="loading"
              />
              <button
                class="btn btn-primary px-4"
                @click="search"
                :disabled="loading || !searchQuery.trim()"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-search me-2"></i>
                Search
              </button>
            </div>

            <!-- Results Count -->
            <div v-if="searchQuery && !loading && articles.length > 0" class="mb-3 text-muted small px-2">
              {{ totalCount }} result{{ totalCount !== 1 ? 's' : '' }}
              <span v-if="page > 1"> • Page {{ page }}</span>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3 text-muted">Searching PubMed...</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="alert alert-danger rounded-4 border-0 shadow-sm">
              <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
            </div>

            <!-- No Results -->
            <div v-else-if="searched && articles.length === 0" class="text-center py-5">
              <i class="bi bi-search display-4 text-muted mb-3 opacity-25"></i>
              <h5>No results found</h5>
              <p class="text-muted">Try different keywords.</p>
            </div>

            <!-- Results List -->
            <div v-else-if="articles.length > 0" class="d-flex flex-column gap-4">
              <div v-for="article in articles" :key="article.pmid" class="article-card card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="card-body p-4">
                  <h5 class="card-title fw-bold mb-3">
                    <a :href="`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`" target="_blank" class="text-decoration-none text-dark">
                      {{ article.title }}
                      <i class="bi bi-box-arrow-up-right ms-2 small opacity-50"></i>
                    </a>
                  </h5>
                  <div class="d-flex flex-wrap gap-3 mb-3">
                    <span class="text-muted small"><i class="bi bi-person me-1"></i>{{ formatAuthors(article.authors) }}</span>
                    <span v-if="article.journal" class="text-muted small">
                      <i class="bi bi-journal-medical me-1"></i>{{ article.journal }}{{ article.pubDate ? ` • ${article.pubDate}` : '' }}
                    </span>
                  </div>
                  
                  <p v-if="article.abstract" class="text-secondary mb-4" style="line-height: 1.6;">
                    {{ truncateAbstract(article.abstract) }}
                  </p>

                  <!-- Actions -->
                  <div class="d-flex flex-wrap gap-2">
                    <button 
                      class="btn btn-sm btn-outline-primary rounded-pill px-3" 
                      @click="summarize(article)" 
                      :disabled="summarizing === article.pmid"
                      :class="{ 'active': articleSummaries[article.pmid] }"
                    >
                      <span v-if="summarizing === article.pmid" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-robot me-2"></i>AI Summary
                    </button>
                    <button v-if="translationReady" class="btn btn-sm btn-outline-info rounded-pill px-3" @click="translate(article)" :disabled="translating === article.pmid">
                      <span v-if="translating === article.pmid" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-translate me-2"></i>Translate CZ
                    </button>
                    <a :href="`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`" target="_blank" class="btn btn-sm btn-light border rounded-pill px-3">
                      <i class="bi bi-pubmed me-2"></i>PubMed
                    </a>
                  </div>

                  <!-- AI Summary Result (Inline) -->
                  <div v-if="articleSummaries[article.pmid] || (summarizing === article.pmid && summaryLoading)" class="mt-4 p-4 bg-primary bg-opacity-10 rounded-4 border-0 fade-in">
                    <div class="d-flex align-items-center mb-3">
                      <i class="bi bi-stars text-primary me-2 h5 mb-0"></i>
                      <h6 class="mb-0 fw-bold text-primary">AI Research Summary</h6>
                      <button class="btn btn-link btn-sm ms-auto text-decoration-none p-0" @click="clearSummary(article.pmid)">
                        <i class="bi bi-x-lg text-primary"></i>
                      </button>
                    </div>
                    
                    <div v-if="summarizing === article.pmid && summaryLoading" class="text-center py-3">
                      <div class="spinner-grow spinner-grow-sm text-primary me-2" role="status"></div>
                      <span class="text-primary small fw-semibold">Analyzing medical content...</span>
                    </div>
                    
                    <div v-else-if="articleSummaries[article.pmid]" class="summary-content text-dark" style="white-space: pre-wrap; line-height: 1.7; font-size: 0.95rem;">
                      {{ articleSummaries[article.pmid] }}
                    </div>
                    
                    <div v-else-if="summaryError && summarizing === article.pmid" class="alert alert-danger bg-white border-0 py-2 small mb-0">
                      {{ summaryError }}
                    </div>
                  </div>

                  <!-- Translation Result -->
                  <div v-if="translations[article.pmid]?.title" class="mt-3 p-3 bg-light rounded-4 border-0">
                    <div class="small text-muted mb-2 fw-bold text-uppercase tracking-wider" style="font-size: 0.7rem;">
                      <i class="bi bi-translate me-1"></i>Czech Translation
                    </div>
                    <div class="fw-bold mb-2">{{ translations[article.pmid]?.title }}</div>
                    <div v-if="translations[article.pmid]?.abstract" class="small text-secondary" style="line-height: 1.5;">{{ translations[article.pmid]?.abstract }}</div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="hasMore || page > 1" class="d-flex justify-content-center gap-2 mt-4">
                <button class="btn btn-outline-primary rounded-pill px-4" @click="prevPage" :disabled="page <= 1 || loading">
                  <i class="bi bi-chevron-left me-2"></i>Previous
                </button>
                <div class="bg-white px-4 py-2 rounded-pill shadow-sm border small fw-bold d-flex align-items-center">
                  Page {{ page }}
                </div>
                <button class="btn btn-outline-primary rounded-pill px-4" @click="nextPage" :disabled="!hasMore || loading">
                  Next<i class="bi bi-chevron-right ms-2"></i>
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!searched" class="text-center py-5">
              <i class="bi bi-book display-4 text-primary mb-3 opacity-25"></i>
              <h5 class="fw-bold">Ready to Explore?</h5>
              <p class="text-muted">Enter keywords to search PubMed medical database.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { searchMedicalLiterature, formatAuthors, truncateAbstract, type PubMedArticle } from '@/services/pubmedApi'
import { useTranslation } from '@/composables/useTranslation'

// State
const searchQuery = ref('')
const articles = ref<PubMedArticle[]>([])
const loading = ref(false)
const searched = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)

// Summary
const articleSummaries = reactive<Record<string, string>>({})
const summaryLoading = ref(false)
const summaryError = ref<string | null>(null)
const summarizing = ref<string | null>(null)

// Translation
const { isLoading: translationLoading, isReady: translationReady, downloadProgress: translationProgress, loadModel: loadTranslationModel, translateToCzech } = useTranslation()
const translating = ref<string | null>(null)
const translations = reactive<Record<string, { title: string; abstract: string }>>({})

// Search
async function search() {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  error.value = null
  searched.value = true
  page.value = 1
  
  try {
    const result = await searchMedicalLiterature(searchQuery.value, 1)
    articles.value = result.articles
    totalCount.value = result.totalCount
    hasMore.value = result.hasMore
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function nextPage() {
  page.value++
  loadPage()
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadPage()
  }
}

async function loadPage() {
  loading.value = true
  try {
    const result = await searchMedicalLiterature(searchQuery.value, page.value)
    articles.value = result.articles
    hasMore.value = result.hasMore
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// AI Summary
async function summarize(article: PubMedArticle) {
  // If already summarized, toggle it? For now just re-generate or keep.
  if (articleSummaries[article.pmid]) {
    delete articleSummaries[article.pmid]
    return
  }

  summaryError.value = null
  summaryLoading.value = true
  summarizing.value = article.pmid

  try {
    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          { role: 'system', content: 'You are a medical research assistant. Summarize articles concisely in 2-3 structured paragraphs.' },
          { role: 'user', content: `Title: ${article.title}\n${article.abstract ? `Abstract: ${article.abstract}` : 'No abstract available.'}` }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    })

    if (response.ok) {
      const data = await response.json()
      articleSummaries[article.pmid] = data.choices?.[0]?.message?.content || 'Unable to generate summary.'
    } else {
      summaryError.value = 'AI service unavailable'
    }
  } catch (err: any) {
    summaryError.value = err.message
  } finally {
    summaryLoading.value = false
    summarizing.value = null
  }
}

function clearSummary(pmid: string) {
  delete articleSummaries[pmid]
}

// Translation
async function translate(article: PubMedArticle) {
  translating.value = article.pmid
  try {
    const titleTranslated = await translateToCzech(article.title)
    const abstractTranslated = article.abstract ? await translateToCzech(article.abstract) : ''
    translations[article.pmid] = { title: titleTranslated, abstract: abstractTranslated }
  } catch (err: any) {
    console.error('Translation failed:', err)
  } finally {
    translating.value = null
  }
}
</script>

<style scoped lang="scss">
.article-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important;
  }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.shadow-sm {
  box-shadow: 0 .125rem .25rem rgba(0,0,0,0.075)!important;
}

.rounded-4 {
  border-radius: 1rem !important;
}
</style>
