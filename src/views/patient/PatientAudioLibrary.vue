<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">Audio knihovna</h4>
            <p class="card-text text-muted mb-0 small">
              Vedené meditace, dechová cvičení a vzdělávací podcasty.
            </p>
          </div>
          <div class="card-body">
            <!-- Now Playing Bar -->
            <div
              v-if="currentEpisode"
              class="now-playing-bar mb-4 p-3 bg-light rounded-4 d-flex align-items-center gap-3"
            >
              <div class="flex-grow-1">
                <div class="fw-bold">{{ currentEpisode.title }}</div>
                <div class="small text-muted">
                  {{ isPlaying ? 'Právě hraje' : 'Pozastaveno' }} • {{ formatTime(currentTime) }} /
                  {{ formatTime(duration) }}
                </div>
              </div>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-outline-secondary rounded-circle"
                  @click="seek(-15)"
                  style="width: 40px; height: 40px"
                  title="Zpět o 15 sekund"
                >
                  <i class="bi bi-rewind-fill"></i>
                </button>
                <button
                  class="btn btn-sm btn-primary rounded-circle"
                  @click="togglePlay()"
                  style="width: 40px; height: 40px"
                >
                  <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary rounded-circle"
                  @click="stopPlayback()"
                  style="width: 40px; height: 40px"
                >
                  <i class="bi bi-stop-fill"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary rounded-circle"
                  @click="seek(15)"
                  style="width: 40px; height: 40px"
                  title="Vpřed o 15 sekund"
                >
                  <i class="bi bi-fast-forward-fill"></i>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Načítání...</span>
              </div>
              <p class="mt-3">Načítání audio zdrojů...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <!-- Audio List Grouped by Topic -->
            <div v-else-if="episodes.length === 0" class="text-center py-5">
              <i class="bi bi-music-note-list display-4 text-muted mb-4"></i>
              <h5>Nenalezeny žádné audio podcasty</h5>
              <p class="text-muted">Zkontrolujte později pro audio obsah.</p>
            </div>

            <div v-else class="d-flex flex-column gap-4">
              <div v-for="group in topicGroups" :key="group.theme" class="topic-section">
                <h5 class="topic-header mb-3">
                  <i class="bi bi-folder me-2"></i>
                  {{ group.displayName }}
                  <span class="badge bg-primary ms-2">{{ group.items.length }}</span>
                </h5>
                <div class="d-flex flex-column gap-3">
                  <div v-for="item in group.items" :key="item.id" class="card border-0 shadow-sm">
                    <div class="card-body">
                  <div class="d-flex align-items-start gap-3">
                    <!-- Play Button -->
                    <button
                      class="btn rounded-circle flex-shrink-0"
                      :class="
                        currentEpisode?.id === item.id && isPlaying
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="playEpisode(item)"
                      style="width: 48px; height: 48px"
                    >
                      <i
                        :class="
                          currentEpisode?.id === item.id && isPlaying
                            ? 'bi bi-pause-fill'
                            : 'bi bi-play-fill'
                        "
                      ></i>
                    </button>

                    <div class="flex-grow-1">
                      <h5 class="card-title mb-1">{{ item.title }}</h5>
                      <div class="mb-2">
                        <span
                          v-for="tag in item.tags"
                          :key="tag"
                          class="badge bg-light text-dark border me-1 mb-1"
                        >
                          {{ tag }}
                        </span>
                      </div>

                      <!-- Progress Bar (shown when this episode is playing) -->
                      <div v-if="currentEpisode?.id === item.id" class="mt-2">
                        <div class="progress" style="height: 6px">
                          <div
                            class="progress-bar bg-primary"
                            :style="{ width: progressPercent + '%' }"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div class="d-flex gap-2 flex-shrink-0">
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
                        @click="showSources(item)"
                      >
                        <i class="bi bi-journal-text me-1"></i> Zdroje
                      </button>
                      <button
                        v-if="item.content_path"
                        class="btn btn-sm btn-outline-secondary"
                        @click="viewContent(item)"
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

    <!-- Hidden Audio Element -->
    <audio
      ref="audioPlayer"
      @timeupdate="updateTime"
      @loadedmetadata="updateDuration"
      @ended="onEnded"
      @canplay="cacheAudio(currentEpisode)"
    >
      Váš prohlížeč nepodporuje audio prvek.
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
  content_path?: string
  sources?: string[]
  tags?: string[]
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
const episodes = ref<ResourceItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Player state
const audioPlayer = ref<HTMLAudioElement | null>(null)
const currentEpisode = ref<ResourceItem | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progressPercent = ref(0)

// Sources modal
const selectedItem = ref<ResourceItem | null>(null)
const itemSources = ref<Source[]>([])
const sources = ref<Record<string, Source>>({})

// Content modal (Markdown)
const contentItem = ref<ResourceItem | null>(null)
const contentHtml = ref<string>('')

// Cache for offline
const cache = ref<Map<string, Blob>>(new Map())

// Derive base asset URL from manifest URL
const baseAssetUrl = import.meta.env.VITE_GITHUB_URL.replace(/manifest\.json$/, '')

onMounted(async () => {
  await fetchManifest()
})

onUnmounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.src = ''
  }
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
    episodes.value = manifest.episodes || []
    sources.value = manifest.sources || {}

    // Group episodes by theme
    groupByTheme()
  } catch (err: any) {
    error.value = `Failed to load audio resources: ${err.message}`
    console.error('[AudioLibrary] Manifest fetch failed:', err)
  } finally {
    loading.value = false
  }
}

// Group episodes by theme/topic
interface TopicGroup {
  theme: string
  displayName: string
  items: ResourceItem[]
}

const topicGroups = ref<TopicGroup[]>([])

function groupByTheme() {
  const groups: Record<string, ResourceItem[]> = {}

  episodes.value.forEach((episode) => {
    const theme = episode.theme || 'uncategorized'
    if (!groups[theme]) {
      groups[theme] = []
    }
    groups[theme].push(episode)
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

function getAssetUrl(assetPath?: string): string {
  if (!assetPath) return ''
  if (assetPath.startsWith('http')) return assetPath
  return `${baseAssetUrl}${assetPath}`
}

function playEpisode(item: ResourceItem) {
  if (!item.asset_url) return

  // If same episode, toggle play/pause
  if (currentEpisode.value?.id === item.id) {
    togglePlay()
    return
  }

  // Load new episode
  currentEpisode.value = item
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  progressPercent.value = 0

  if (audioPlayer.value) {
    audioPlayer.value.src = getAssetUrl(item.asset_url)
    audioPlayer.value.load()
    audioPlayer.value
      .play()
      .then(() => {
        isPlaying.value = true
      })
      .catch((err) => {
        console.error('[AudioLibrary] Playback failed:', err)
      })
  }
}

function togglePlay() {
  if (!audioPlayer.value || !currentEpisode.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    audioPlayer.value
      .play()
      .then(() => {
        isPlaying.value = true
      })
      .catch((err) => {
        console.error('[AudioLibrary] Playback failed:', err)
      })
  }
}

function stopPlayback() {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    audioPlayer.value.currentTime = 0
  }
  isPlaying.value = false
  currentTime.value = 0
  progressPercent.value = 0
}

function seek(seconds: number) {
  if (!audioPlayer.value || !currentEpisode.value) return

  const newTime = audioPlayer.value.currentTime + seconds
  audioPlayer.value.currentTime = Math.max(0, Math.min(newTime, audioPlayer.value.duration || 0))
  currentTime.value = audioPlayer.value.currentTime
  progressPercent.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
}

function updateTime() {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
  progressPercent.value = duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
}

function updateDuration() {
  if (!audioPlayer.value) return
  duration.value = audioPlayer.value.duration
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  progressPercent.value = 0
}

async function cacheAudio(item: ResourceItem | null) {
  if (!item?.asset_url) return
  const url = getAssetUrl(item.asset_url)
  if (cache.value.has(url)) return

  try {
    const response = await fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      cache.value.set(url, blob)
      console.log(`[AudioLibrary] Cached: ${url}`)
    }
  } catch (err) {
    console.warn(`[AudioLibrary] Failed to cache: ${url}`, err)
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
    console.error('[AudioLibrary] Content fetch failed:', err)
  }
}
</script>

<style scoped>
.now-playing-bar {
  border: 1px solid #dee2e6;
}
.progress {
  border-radius: 3px;
}
.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
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
