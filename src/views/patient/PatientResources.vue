<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">Vzdělávací zdroje</h4>
            <p class="card-text text-muted mb-0 small">
              Infografiky, prezentace a audio podcasty z našeho vzdělávacího repozitáře.
            </p>
          </div>
          <div class="card-body">
            <!-- Tabs -->
            <ul class="nav nav-tabs mb-4">
              <li class="nav-item">
                <a
                  class="nav-link"
                  :class="{ active: activeTab === 'infographics' }"
                  @click="activeTab = 'infographics'"
                >
                  <i class="bi bi-card-image me-1"></i> Infografiky
                  <span class="badge bg-primary ms-1">{{ infographics.length }}</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  :class="{ active: activeTab === 'presentations' }"
                  @click="activeTab = 'presentations'"
                >
                  <i class="bi bi-file-earmark-pdf me-1"></i> Prezentace
                  <span class="badge bg-primary ms-1">{{ presentations.length }}</span>
                </a>
              </li>
            </ul>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Načítání...</span>
              </div>
              <p class="mt-3">Načítání zdrojů z repozitáře...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <!-- Infographics Tab (v-show for proper structure) -->
            <div v-show="!loading && !error && activeTab === 'infographics'">
              <div v-if="infographics.length === 0" class="text-center py-5">
                <i class="bi bi-card-image display-4 text-muted mb-4"></i>
                <h5>Nenalezeny žádné infografiky</h5>
                <p class="text-muted">Zkontrolujte později pro vzdělávací materiály.</p>
              </div>

              <div v-else class="d-flex flex-column gap-5">
                <div v-for="group in infographicGroups" :key="group.theme" class="topic-section">
                  <h5 class="topic-header mb-3">
                    <i class="bi bi-folder me-2"></i>
                    {{ group.displayName }}
                    <span class="badge bg-primary ms-2">{{ group.items.length }}</span>
                  </h5>
                  <div class="row g-4">
                    <div v-for="item in group.items" :key="item.id" class="col-md-6 col-lg-4">
                      <div class="card h-100 shadow-sm border-0" :class="getOrientationClass(item)" @click="openPreview(item)">
                        <div class="card-body">
                          <div
                            class="position-relative mb-3 overflow-hidden rounded"
                            :class="`orientation-container orientation-${item.orientation || 'unknown'}`"
                            style="height: 200px; background: #f8f9fa"
                          >
                            <!-- Image thumbnail -->
                            <img
                              v-if="isImage(item) && !thumbnailError[item.id]"
                              :src="getThumbnailUrl(item)"
                              :alt="item.title"
                              class="w-100 h-100"
                              :style="{ objectFit: isPortrait(item) ? 'contain' : 'cover' }"
                              @error="handleThumbnailError(item.id)"
                            />
                            <!-- Video thumbnail with play icon -->
                            <div
                              v-else-if="isVideo(item)"
                              class="w-100 h-100 d-flex align-items-center justify-content-center position-relative"
                            >
                              <video
                                v-if="!thumbnailError[item.id]"
                                :src="getAssetUrl(item.asset_url)"
                                class="w-100 h-100"
                                :style="{ objectFit: 'cover' }"
                                muted
                                preload="metadata"
                                @error="handleThumbnailError(item.id)"
                              ></video>
                              <div
                                class="position-absolute top-50 start-50 translate-middle"
                                style="z-index: 2"
                              >
                                <i
                                  class="bi bi-play-circle-fill text-white"
                                  style="font-size: 3rem; text-shadow: 0 2px 8px rgba(0,0,0,0.5)"
                                ></i>
                              </div>
                            </div>
                            <!-- Fallback -->
                            <div
                              v-else
                              class="w-100 h-100 d-flex align-items-center justify-content-center"
                            >
                              <i
                                :class="isVideo(item) ? 'bi bi-film' : 'bi bi-card-image'"
                                class="text-muted"
                                style="font-size: 2rem"
                              ></i>
                            </div>
                            <!-- Badge for video -->
                            <span
                              v-if="isVideo(item)"
                              class="position-absolute top-0 end-0 badge bg-danger m-2"
                            >
                              <i class="bi bi-film me-1"></i> Video
                            </span>
                            <!-- Badge for orientation -->
                            <span
                              v-if="item.orientation"
                              class="position-absolute bottom-0 end-0 badge m-2"
                              :class="item.orientation === 'portrait' ? 'bg-info' : item.orientation === 'landscape' ? 'bg-success' : 'bg-secondary'"
                            >
                              <i
                                :class="item.orientation === 'portrait' ? 'bi bi-phone' : item.orientation === 'landscape' ? 'bi bi-display' : 'bi bi-square'"
                              ></i>
                              {{ item.orientation }}
                            </span>
                          </div>
                          <h5 class="card-title">{{ item.title }}</h5>
                          <div class="mb-3">
                            <span
                              v-for="tag in item.tags"
                              :key="tag"
                              class="badge bg-light text-dark border me-1 mb-1"
                            >
                              {{ tag }}
                            </span>
                          </div>

                          <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="bi bi-eye me-1"></i> Náhled
                            </button>
                            <a
                              :href="getAssetUrl(item.asset_url)"
                              download
                              class="btn btn-sm btn-outline-success"
                            >
                              <i class="bi bi-download me-1"></i> Stáhnout
                            </a>
                            <button
                              v-if="item.sources && item.sources.length > 0"
                              class="btn btn-sm btn-outline-info"
                              @click.stop="showSources(item)"
                            >
                              <i class="bi bi-journal-text me-1"></i> Zdroje
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Presentations Tab -->
            <div v-show="!loading && !error && activeTab === 'presentations'">
              <div v-if="presentations.length === 0" class="text-center py-5">
                <i class="bi bi-file-earmark-pdf display-4 text-muted mb-4"></i>
                <h5>Nenalezeny žádné prezentace</h5>
                <p class="text-muted">Zkontrolujte později pro prezentace.</p>
              </div>

              <div v-else class="d-flex flex-column gap-5">
                <div v-for="group in presentationGroups" :key="group.theme" class="topic-section">
                  <h5 class="topic-header mb-3">
                    <i class="bi bi-folder me-2"></i>
                    {{ group.displayName }}
                    <span class="badge bg-primary ms-2">{{ group.items.length }}</span>
                  </h5>
                  <div class="row g-4">
                    <div v-for="item in group.items" :key="item.id" class="col-md-6 col-lg-4">
                      <div class="card h-100 shadow-sm border-0" :class="getOrientationClass(item)" @click="openPdfPreview(item)">
                        <div class="card-body">
                          <div
                            class="mb-3 rounded overflow-hidden position-relative"
                            style="height: 200px; background: #f8f9fa"
                          >
                            <!-- PDF thumbnail -->
                            <img
                              v-if="item.thumbnail_url && !thumbnailError[item.id]"
                              :src="item.thumbnail_url"
                              :alt="item.title"
                              class="w-100 h-100"
                              style="object-fit: contain"
                              @error="handleThumbnailError(item.id)"
                            />
                            <div
                              v-else
                              class="w-100 h-100 d-flex align-items-center justify-content-center"
                            >
                              <i class="bi bi-file-earmark-pdf text-danger" style="font-size: 3rem"></i>
                            </div>
                            <!-- Orientation badge -->
                            <span
                              v-if="item.orientation"
                              class="position-absolute bottom-0 end-0 badge m-2"
                              :class="item.orientation === 'portrait' ? 'bg-info' : item.orientation === 'landscape' ? 'bg-success' : 'bg-secondary'"
                            >
                              <i
                                :class="item.orientation === 'portrait' ? 'bi bi-phone' : item.orientation === 'landscape' ? 'bi bi-display' : 'bi bi-square'"
                              ></i>
                              {{ item.orientation }}
                            </span>
                          </div>
                          <h5 class="card-title">{{ item.title }}</h5>
                          <div class="mb-3">
                            <span
                              v-for="tag in item.tags"
                              :key="tag"
                              class="badge bg-light text-dark border me-1 mb-1"
                            >
                              {{ tag }}
                            </span>
                          </div>

                          <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-primary">
                              <i class="bi bi-eye me-1"></i> Zobrazit PDF
                            </button>
                            <a
                              :href="getAssetUrl(item.asset_url)"
                              download
                              class="btn btn-sm btn-outline-success"
                            >
                              <i class="bi bi-download me-1"></i> Stáhnout
                            </a>
                            <button
                              v-if="item.sources && item.sources.length > 0"
                              class="btn btn-sm btn-outline-info"
                              @click.stop="showSources(item)"
                            >
                              <i class="bi bi-journal-text me-1"></i> Zdroje
                            </button>
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
    </div>

    <!-- Preview Modal for Infographics (Images/Videos) -->
    <div
      v-if="previewItem && previewItem.type !== 'presentation'"
      class="modal fade show"
      style="display: block; background: rgba(0, 0, 0, 0.7)"
      @click.self="previewItem = null"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">{{ previewItem.title }}</h5>
            <button type="button" class="btn-close" @click="previewItem = null"></button>
          </div>
          <div class="modal-body text-center p-4">
            <img
              v-if="isImage(previewItem)"
              :src="getAssetUrl(previewItem.asset_url)"
              :alt="previewItem.title"
              class="img-fluid rounded shadow-sm"
              style="max-height: 70vh"
            />
            <video
              v-else-if="isVideo(previewItem)"
              :src="getAssetUrl(previewItem.asset_url)"
              controls
              class="img-fluid rounded"
              style="max-height: 70vh"
            >
              Váš prohlížeč nepodporuje video prvek.
            </video>
          </div>
          <div class="modal-footer">
            <a :href="getAssetUrl(previewItem.asset_url)" download class="btn btn-primary w-100">
              <i class="bi bi-download me-2"></i> Stáhnout
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Preview Modal -->
    <div
      v-if="previewItem && previewItem.type === 'presentation'"
      class="modal fade show"
      style="display: block; background: rgba(0, 0, 0, 0.7)"
      @click.self="previewItem = null"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-file-earmark-pdf me-2 text-danger"></i>
              {{ previewItem.title }}
            </h5>
            <button type="button" class="btn-close" @click="previewItem = null"></button>
          </div>
          <div class="modal-body p-0" style="height: 70vh">
            <iframe
              :src="getAssetUrl(previewItem.asset_url)"
              class="w-100 h-100 border-0"
              title="PDF Preview"
            ></iframe>
          </div>
          <div class="modal-footer">
            <a :href="getAssetUrl(previewItem.asset_url)" download class="btn btn-primary w-100">
              <i class="bi bi-download me-2"></i> Stáhnout PDF
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sources Modal -->
    <div
      v-if="selectedItem && !previewItem"
      class="modal fade show"
      style="display: block; background: rgba(0, 0, 0, 0.5)"
      @click.self="selectedItem = null"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header bg-info text-white">
            <h5 class="modal-title">
              <i class="bi bi-journal-text me-2"></i>
              Zdroje: {{ selectedItem.title }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="selectedItem = null"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="itemSources.length === 0" class="text-center text-muted py-3">
              Pro tuto položku nejsou uvedeny žádné zdroje.
            </div>
            <div v-else>
              <div
                v-for="(source, index) in itemSources"
                :key="source.id || index"
                class="card mb-3 border-0 shadow-sm"
              >
                <div class="card-body">
                  <h6 class="card-title">{{ source.title || 'Nepojmenovaný zdroj' }}</h6>
                  <p v-if="source.author" class="text-muted small mb-1">
                    <i class="bi bi-person me-1"></i> {{ source.author }}
                  </p>
                  <p v-if="source.publisher" class="text-muted small mb-1">
                    <i class="bi bi-building me-1"></i> {{ source.publisher }}
                  </p>
                  <p v-if="source.summary" class="small mt-2">{{ source.summary }}</p>
                  <div v-if="source.links" class="mt-2">
                    <a
                      v-if="source.links.url"
                      :href="source.links.url"
                      target="_blank"
                      class="btn btn-sm btn-outline-primary me-2"
                    >
                      <i class="bi bi-box-arrow-up-right me-1"></i> Navštívit
                    </a>
                    <a
                      v-if="source.links.doi"
                      :href="`https://doi.org/${source.links.doi}`"
                      target="_blank"
                      class="btn btn-sm btn-outline-secondary"
                    >
                      <i class="bi bi-link-45deg me-1"></i> DOI
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Modal (Markdown) -->
    <div
      v-if="contentItem"
      class="modal fade show"
      style="display: block; background: rgba(0, 0, 0, 0.5)"
      @click.self="contentItem = null"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-file-text me-2"></i>
              {{ contentItem.title }}
            </h5>
            <button type="button" class="btn-close" @click="contentItem = null"></button>
          </div>
          <div class="modal-body">
            <div v-if="contentHtml === 'Načítání...'" class="text-center py-3">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Načítání...</span>
              </div>
            </div>
            <div v-else class="markdown-content" v-html="contentHtml"></div>
          </div>
          <div class="modal-footer">
            <a
              v-if="contentItem.content_path"
              :href="getAssetUrl(contentItem.content_path)"
              target="_blank"
              class="btn btn-outline-primary"
            >
              <i class="bi bi-box-arrow-up-right me-1"></i> Otevřít v novém okně
            </a>
            <button type="button" class="btn btn-secondary" @click="contentItem = null">
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

// Configure marked for GFM support
marked.setOptions({ gfm: true })

interface ResourceItem {
  id: string
  title: string
  theme?: string
  type?: string
  subtype?: string
  asset_url?: string
  thumbnail_url?: string
  orientation?: 'landscape' | 'portrait' | 'square'
  sources?: string[]
  tags?: string[]
  content_path?: string
}

interface Source {
  id: string
  title: string
  author?: string
  publisher?: string
  summary?: string
  links?: {
    url?: string
    doi?: string
  }
}

interface Manifest {
  infographics: ResourceItem[]
  episodes: ResourceItem[]
  presentations: ResourceItem[]
  sources: Record<string, Source>
}

// State
const activeTab = ref<'infographics' | 'presentations'>('infographics')
const infographics = ref<ResourceItem[]>([])
const presentations = ref<ResourceItem[]>([])
const sources = ref<Record<string, Source>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const thumbnailError = ref<Record<string, boolean>>({})

// Cache storage for thumbnails and audio
const cache = ref<Map<string, Blob>>(new Map())

// Modal state
const selectedItem = ref<ResourceItem | null>(null)
const itemSources = ref<Source[]>([])
const previewItem = ref<ResourceItem | null>(null)
const contentItem = ref<ResourceItem | null>(null)
const contentHtml = ref<string>('')

// Group by theme
interface TopicGroup {
  theme: string
  displayName: string
  items: ResourceItem[]
}

const infographicGroups = ref<TopicGroup[]>([])
const presentationGroups = ref<TopicGroup[]>([])

function groupByTheme() {
  // Group infographics
  const igGroups: Record<string, ResourceItem[]> = {}
  infographics.value.forEach((item) => {
    const theme = item.theme || 'uncategorized'
    if (!igGroups[theme]) igGroups[theme] = []
    igGroups[theme].push(item)
  })
  infographicGroups.value = Object.entries(igGroups).map(([theme, items]) => ({
    theme,
    displayName: formatThemeName(theme),
    items,
  }))

  // Group presentations
  const prGroups: Record<string, ResourceItem[]> = {}
  presentations.value.forEach((item) => {
    const theme = item.theme || 'uncategorized'
    if (!prGroups[theme]) prGroups[theme] = []
    prGroups[theme].push(item)
  })
  presentationGroups.value = Object.entries(prGroups).map(([theme, items]) => ({
    theme,
    displayName: formatThemeName(theme),
    items,
  }))
}

function formatThemeName(theme: string): string {
  return theme
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

onMounted(async () => {
  await fetchManifest()
})

async function fetchManifest() {
  loading.value = true
  error.value = null

  try {
    const manifestUrl = import.meta.env.VITE_GITHUB_URL

    if (!manifestUrl) {
      throw new Error('VITE_GITHUB_URL is not defined. Please create a .env file with VITE_GITHUB_URL=https://nightguarder.github.io/Vue-Education-Materials/manifest.json')
    }

    const response = await fetch(manifestUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`)
    }

    const manifest: Manifest = await response.json()

    infographics.value = manifest.infographics || []
    presentations.value = manifest.presentations || []
    sources.value = manifest.sources || {}

    // Group by theme
    groupByTheme()

    // Preload thumbnails for offline caching
    preloadThumbnails()
  } catch (err: any) {
    error.value = `Failed to load resources: ${err.message}. Please check your connection.`
    console.error('[Resources] Manifest fetch failed:', err)
  } finally {
    loading.value = false
  }
}

function getAssetUrl(assetPath?: string): string {
  if (!assetPath) return ''
  return assetPath
}

function getThumbnailUrl(item: ResourceItem): string {
  if (item.thumbnail_url) {
    return item.thumbnail_url
  }
  if (!item.asset_url) return ''
  return item.asset_url
}

function isImage(item: ResourceItem): boolean {
  const url = item.asset_url || ''
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url)
}

function isVideo(item: ResourceItem): boolean {
  const url = item.asset_url || ''
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(url) || item.subtype === 'video'
}

function isPortrait(item: ResourceItem): boolean {
  if (item.orientation) {
    return item.orientation === 'portrait'
  }
  return item.subtype === 'portrait' || item.tags?.includes('portrait') || false
}

function getOrientationClass(item: ResourceItem): string {
  if (item.orientation) {
    return `orientation-${item.orientation}`
  }
  if (isPortrait(item)) return 'orientation-portrait'
  return 'orientation-landscape'
}

function openPreview(item: ResourceItem) {
  previewItem.value = item
}

function openPdfPreview(item: ResourceItem) {
  previewItem.value = item
}

function preloadThumbnails() {
  const allItems = [...infographics.value, ...presentations.value]
  allItems.forEach((item) => {
    if (item.thumbnail_url) {
      cacheAsset(item.thumbnail_url)
    }
  })
}

async function cacheAsset(url: string) {
  if (cache.value.has(url)) return

  try {
    const response = await fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      cache.value.set(url, blob)
      console.log(`[Resources] Cached: ${url}`)
    }
  } catch (err) {
    console.warn(`[Resources] Failed to cache: ${url}`, err)
  }
}

function handleThumbnailError(itemId: string) {
  thumbnailError.value[itemId] = true
}

function showSources(item: ResourceItem) {
  selectedItem.value = item
  itemSources.value = []

  if (item.sources && sources.value) {
    item.sources.forEach((sourceId) => {
      const source = sources.value[sourceId]
      if (source) {
        itemSources.value.push(source)
      }
    })
  }
}

async function viewContent(item: ResourceItem) {
  if (!item.content_path) return

  contentItem.value = item
  contentHtml.value = 'Načítání...'

  try {
    const url = getAssetUrl(item.content_path)
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch content')
    const markdown = await response.text()
    contentHtml.value = await marked.parse(markdown)
  } catch (err) {
    contentHtml.value = 'Chyba při načítání obsahu.'
    console.error('[Resources] Content fetch failed:', err)
  }
}
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #495057;
  border: none;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #2c5282;
  border-bottom-color: #2c5282;
  font-weight: 500;
}

.card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.modal-dialog {
  max-height: 90vh;
}

.modal-body iframe {
  border-radius: 0 0 12px 12px;
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content p {
  margin-bottom: 1rem;
}

.markdown-content ul,
.markdown-content ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.markdown-content code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.orientation-portrait .card-body img,
.orientation-portrait video {
  object-fit: contain !important;
}

.orientation-landscape .card-body img,
.orientation-landscape video {
  object-fit: cover !important;
}

.orientation-square .card-body img,
.orientation-square video {
  object-fit: contain !important;
}

.topic-header {
  color: #2c5282;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.topic-section {
  margin-bottom: 2rem;
}
</style>
