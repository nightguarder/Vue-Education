<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">Educational Resources</h4>
            <p class="card-text text-muted mb-0 small">
              Infographics and audio podcasts from our educational repository.
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
                  <i class="bi bi-card-image me-1"></i> Infographics
                  <span class="badge bg-primary ms-1">{{ infographics.length }}</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="nav-link"
                  :class="{ active: activeTab === 'audio' }"
                  @click="activeTab = 'audio'"
                >
                  <i class="bi bi-music-note-list me-1"></i> Audio Podcasts
                  <span class="badge bg-success ms-1">{{ episodes.length }}</span>
                </a>
              </li>
            </ul>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3">Loading resources from repository...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <!-- Infographics Tab -->
            <div v-else-if="activeTab === 'infographics'">
              <div v-if="infographics.length === 0" class="text-center py-5">
                <i class="bi bi-card-image display-4 text-muted mb-4"></i>
                <h5>No infographics found</h5>
                <p class="text-muted">Check back later for educational materials.</p>
              </div>

              <div v-else class="row g-4">
                <div v-for="item in infographics" :key="item.id" class="col-md-6 col-lg-4">
                  <div class="card h-100 shadow-sm border-0">
                    <div class="card-body">
                      <img
                        v-if="!thumbnailError[item.id]"
                        :src="getThumbnailUrl(item)"
                        :alt="item.title"
                        class="img-fluid rounded mb-3"
                        style="max-height: 200px; object-fit: cover; width: 100%"
                        @error="handleThumbnailError(item.id)"
                      />
                      <div
                        v-else
                        class="bg-light d-flex align-items-center justify-content-center mb-3"
                        style="height: 200px; border-radius: 8px"
                      >
                        <i class="bi bi-card-image text-muted" style="font-size: 2rem"></i>
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
                        <a
                          :href="getAssetUrl(item.asset_url)"
                          download
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="bi bi-download me-1"></i> Download
                        </a>
                        <button
                          v-if="item.sources && item.sources.length > 0"
                          class="btn btn-sm btn-outline-info"
                          @click="showSources(item)"
                        >
                          <i class="bi bi-journal-text me-1"></i> Sources
                        </button>
                        <button
                          v-if="item.content_path"
                          class="btn btn-sm btn-outline-secondary"
                          @click="viewContent(item)"
                        >
                          <i class="bi bi-file-text me-1"></i> Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Audio Podcasts Tab -->
            <div v-else-if="activeTab === 'audio'">
              <div v-if="episodes.length === 0" class="text-center py-5">
                <i class="bi bi-music-note-list display-4 text-muted mb-4"></i>
                <h5>No audio podcasts found</h5>
                <p class="text-muted">Check back later for audio content.</p>
              </div>

              <div v-else class="d-flex flex-column gap-3">
                <div v-for="item in episodes" :key="item.id" class="card shadow-sm border-0">
                  <div class="card-body">
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

                    <!-- Audio Player -->
                    <div class="audio-player mb-3">
                      <audio
                        controls
                        class="w-100"
                        :src="getAssetUrl(item.asset_url)"
                        @canplay="cacheAudio(item)"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>

                    <div class="d-flex gap-2 flex-wrap">
                      <a
                        :href="getAssetUrl(item.asset_url)"
                        download
                        class="btn btn-sm btn-outline-success"
                      >
                        <i class="bi bi-download me-1"></i> Download
                      </a>
                      <button
                        v-if="item.sources && item.sources.length > 0"
                        class="btn btn-sm btn-outline-info"
                        @click="showSources(item)"
                      >
                        <i class="bi bi-journal-text me-1"></i> Sources
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
              Sources: {{ selectedItem.title }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="selectedItem = null"
            ></button>
          </div>
          <div class="modal-body">
            <div v-if="itemSources.length === 0" class="text-center text-muted py-3">
              No sources listed for this item.
            </div>
            <div v-else>
              <div
                v-for="(source, index) in itemSources"
                :key="source.id || index"
                class="card mb-3 border-0 shadow-sm"
              >
                <div class="card-body">
                  <h6 class="card-title">{{ source.title || 'Untitled Source' }}</h6>
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
                      <i class="bi bi-box-arrow-up-right me-1"></i> Visit
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Types
interface ResourceItem {
  id: string
  title: string
  theme?: string
  type?: string
  subtype?: string
  asset_url?: string
  thumbnail_url?: string
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
  sources: Record<string, Source>
}

// State
const activeTab = ref<'infographics' | 'audio'>('infographics')
const infographics = ref<ResourceItem[]>([])
const episodes = ref<ResourceItem[]>([])
const sources = ref<Record<string, Source>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const thumbnailError = ref<Record<string, boolean>>({})
const githubURL =
  import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/nightguarder/Vue-Education-Materials'

// Modal state
const selectedItem = ref<ResourceItem | null>(null)
const itemSources = ref<Source[]>([])

onMounted(async () => {
  await fetchManifest()
})

async function fetchManifest() {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(githubURL)

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`)
    }

    const manifest: Manifest = await response.json()

    infographics.value = manifest.infographics || []
    episodes.value = manifest.episodes || []
    sources.value = manifest.sources || {}
  } catch (err: any) {
    error.value = `Failed to load resources: ${err.message}. Please check your connection.`
    console.error('[Resources] Manifest fetch failed:', err)
  } finally {
    loading.value = false
  }
}

function getAssetUrl(assetPath?: string): string {
  if (!assetPath) return ''
  // Manifest already contains full URLs
  return assetPath
}

function getThumbnailUrl(item: ResourceItem): string {
  if (item.thumbnail_url) {
    return item.thumbnail_url
  }

  // Fallback to asset_url if thumbnail_url is missing
  if (!item.asset_url) return ''
  return item.asset_url
}

function handleThumbnailError(itemId: string) {
  thumbnailError.value[itemId] = true
}

function preloadAssets() {
  // Cache infographic images
  infographics.value.forEach((item) => {
    if (item.asset_url) {
      cacheAsset(getAssetUrl(item.asset_url))
    }
  })

  // Cache audio files
  episodes.value.forEach((item) => {
    if (item.asset_url) {
      cacheAsset(getAssetUrl(item.asset_url))
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

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
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

function viewContent(item: ResourceItem) {
  if (item.content_path) {
    const url = getAssetUrl(item.content_path)
    window.open(url, '_blank')
  }
}

function cacheAudio(item: ResourceItem) {
  if (item.asset_url) {
    cacheAsset(getAssetUrl(item.asset_url))
  }
}
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #495057;
  border: none;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #2c5282;
  border-bottom-color: #2c5282;
  font-weight: 500;
}

.audio-player audio {
  height: 40px;
}

.card {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
</style>
