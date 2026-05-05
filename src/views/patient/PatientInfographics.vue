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
  description?: string
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

const infographics = ref<ResourceItem[]>([])
const sources = ref<Record<string, Source>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const thumbnailError = ref<Record<string, boolean>>({})

const activeItem = ref<ResourceItem | null>(null)
const selectedItem = ref<ResourceItem | null>(null)
const itemSources = ref<Source[]>([])
const contentItem = ref<ResourceItem | null>(null)
const contentHtml = ref<string>('')

// Group infographics by theme
interface TopicGroup {
  theme: string
  displayName: string
  items: ResourceItem[]
}

const topicGroups = ref<TopicGroup[]>([])

function groupByTheme() {
  const groups: Record<string, ResourceItem[]> = {}

  infographics.value.forEach((item) => {
    const theme = item.theme || 'uncategorized'
    if (!groups[theme]) {
      groups[theme] = []
    }
    groups[theme].push(item)
  })

  topicGroups.value = Object.entries(groups).map(([theme, items]) => ({
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
    sources.value = manifest.sources || {}

    // Group infographics by theme
    groupByTheme()
  } catch (err: any) {
    error.value = `Failed to load infographics: ${err.message}`
    console.error('[Infographics] Manifest fetch failed:', err)
  } finally {
    loading.value = false
  }
}

function getAssetUrl(assetPath?: string): string {
  if (!assetPath) return ''
  return assetPath
}

function getThumbnailUrl(item: ResourceItem): string {
  if (item.thumbnail_url) return item.thumbnail_url
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

function getAspectRatio(item: ResourceItem): string {
  if (item.orientation === 'portrait') return '1 / 1.414'
  if (item.orientation === 'landscape') return '1.414 / 1'
  if (item.orientation === 'square') return '1 / 1'
  // Fallback to portrait default
  return isPortrait(item) ? '1 / 1.414' : '1.414 / 1'
}

function openPreview(item: ResourceItem) {
  activeItem.value = item
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
    console.error('[Infographics] Content fetch failed:', err)
  }
}
</script>

<template>
  <div class="infographics-view container py-5">
    <div class="row mb-5">
      <div class="col-12 text-center">
        <h1 class="display-5 fw-bold mb-3">Vzdělávací infografiky</h1>
        <p class="lead text-muted">
          Prohlédněte si a stáhněte vzdělávací materiály.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Načítání...</span>
      </div>
      <p class="mt-3">Načítání infografik...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- Infographics Grid Grouped by Topic -->
    <div v-else-if="infographics.length === 0" class="text-center py-5">
      <i class="bi bi-card-image display-4 text-muted mb-4"></i>
      <h5>Nenalezeny žádné infografiky</h5>
    </div>

    <div v-else class="d-flex flex-column gap-5">
      <div v-for="group in topicGroups" :key="group.theme" class="topic-section">
        <h5 class="topic-header mb-3">
          <i class="bi bi-folder me-2"></i>
          {{ group.displayName }}
          <span class="badge bg-primary ms-2">{{ group.items.length }}</span>
        </h5>
        <div class="row g-4">
          <div v-for="item in group.items" :key="item.id" class="col-md-6 col-lg-4">
        <div class="infographic-card h-100 shadow-sm border-0" :class="getOrientationClass(item)" @click="openPreview(item)">
          <div class="position-relative overflow-hidden card-img-container" :style="{ aspectRatio: getAspectRatio(item) }">
            <!-- Image -->
            <img
              v-if="isImage(item) && !thumbnailError[item.id]"
              :src="getThumbnailUrl(item)"
              :alt="item.title"
              class="card-img-top"
              :style="{ objectFit: item.orientation === 'portrait' || (!item.orientation && isPortrait(item)) ? 'contain' : 'cover' }"
              @error="thumbnailError[item.id] = true"
            />
            <!-- Video with play overlay -->
            <div
              v-else-if="isVideo(item)"
              class="w-100 h-100 position-relative"
            >
              <video
                :src="getAssetUrl(item.asset_url)"
                class="card-img-top"
                muted
                preload="metadata"
                @error="thumbnailError[item.id] = true"
              ></video>
              <div class="position-absolute top-50 start-50 translate-middle">
                <i class="bi bi-play-circle-fill text-white" style="font-size: 3rem; text-shadow: 0 2px 8px rgba(0,0,0,0.5)"></i>
              </div>
            </div>
            <!-- Fallback -->
            <div
              v-else
              class="w-100 h-100 d-flex align-items-center justify-content-center bg-light"
            >
              <i class="bi bi-card-image text-muted" style="font-size: 3rem"></i>
            </div>

            <div class="overlay">
              <i class="bi bi-zoom-in fs-1 text-white"></i>
            </div>
            <span v-if="isVideo(item)" class="category-badge bg-danger text-white">
              <i class="bi bi-film me-1"></i> Video
            </span>
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
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-2">{{ item.title }}</h5>
            <p v-if="item.description" class="card-text text-muted small mb-3">{{ item.description }}</p>
            <div class="mb-3">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="badge bg-light text-dark border me-1 mb-1"
              >
                {{ tag }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <button class="btn btn-outline-primary btn-sm">
                <i class="bi bi-eye me-1"></i> Náhled
              </button>
              <a :href="getAssetUrl(item.asset_url)" download class="btn btn-primary btn-sm">
                <i class="bi bi-download me-1"></i> Stáhnout
              </a>
              <button
                v-if="item.content_path"
                class="btn btn-outline-secondary btn-sm"
                @click.stop="viewContent(item)"
              >
                <i class="bi bi-file-text me-1"></i> Podrobnosti
              </button>
            </div>
          </div>
      </div>
    </div>
  </div>
      </div>
</div>

    <!-- Preview Modal -->
    <div v-if="activeItem" class="modal-backdrop fade show"></div>
    <div
      v-if="activeItem"
      class="modal fade show d-block"
      @click.self="activeItem = null"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">{{ activeItem.title }}</h5>
            <button type="button" class="btn-close" @click="activeItem = null"></button>
          </div>
          <div class="modal-body text-center p-4">
            <img
              v-if="isImage(activeItem)"
              :src="getAssetUrl(activeItem.asset_url)"
              :alt="activeItem.title"
              class="img-fluid rounded shadow-sm"
              style="max-height: 70vh"
            />
            <video
              v-else-if="isVideo(activeItem)"
              :src="getAssetUrl(activeItem.asset_url)"
              controls
              class="img-fluid rounded"
              style="max-height: 70vh"
            >
              Váš prohlížeč nepodporuje video prvek.
            </video>
            <p v-if="activeItem.description" class="mt-4 text-muted">{{ activeItem.description }}</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <a :href="getAssetUrl(activeItem.asset_url)" download class="btn btn-primary w-100 py-2">
              <i class="bi bi-download me-2"></i> Stáhnout
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sources Modal -->
    <div
      v-if="selectedItem"
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
            <button type="button" class="btn-close btn-close-white" @click="selectedItem = null"></button>
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

<style scoped lang="scss">
.infographics-view {
  max-width: 1100px;
}

.infographic-card {
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border-radius: 20px;
  overflow: hidden;
  background: white;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;

    .overlay {
      opacity: 1;
    }

    .card-img-top {
      transform: scale(1.05);
    }
  }
}

.card-img-container {
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-img-top {
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.orientation-portrait .card-img-top {
  object-fit: contain;
}

.orientation-landscape .card-img-top {
  object-fit: cover;
}

.orientation-square .card-img-top {
  object-fit: contain;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-content {
  border-radius: 25px;
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
