<template>
  <div class="patient-blog container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-10 col-lg-8">
        <div class="d-flex align-items-center mb-4">
          <h2 class="fw-bold mb-0 text-primary">
            <i class="bi bi-journal-text me-2"></i>Pacientský blog
          </h2>
          <div class="ms-auto">
            <span class="badge bg-primary rounded-pill px-3">{{ publishedPosts.length }} článků</span>
          </div>
        </div>

        <div v-if="publishedPosts.length === 0" class="text-center py-5 bg-white rounded-4 shadow-sm">
          <i class="bi bi-collection display-4 text-muted opacity-25 mb-3"></i>
          <h5>Zatím nebyly publikovány žádné články</h5>
          <p class="text-muted">Lékař zde brzy publikuje nejnovější poznatky z medicínského výzkumu.</p>
        </div>

        <div v-else class="d-flex flex-column gap-5">
          <article v-for="post in publishedPosts" :key="post.id" class="blog-card bg-white rounded-4 shadow-sm overflow-hidden border-0">
            <div class="p-4 p-md-5">
              <div class="d-flex align-items-center mb-3">
                <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 small me-3">
                  <i class="bi bi-stars me-1"></i>Odborný přehled
                </span>
                <span class="text-muted small">
                  <i class="bi bi-calendar3 me-1"></i>{{ formatDate(post.date) }}
                </span>
              </div>
              
              <h2 class="fw-bold mb-4">{{ post.title }}</h2>
              
              <div class="markdown-content" v-html="renderMarkdown(post.content)"></div>

              <!-- Figures in Blog -->
              <div v-if="post.figures?.length" class="mt-5 border-top pt-4">
                <h5 class="fw-bold mb-4 text-primary">Obrázky a schémata ze studie</h5>
                <div class="row g-4">
                  <div v-for="fig in post.figures" :key="fig.id" class="col-12">
                    <div class="card border-0 bg-light rounded-4 overflow-hidden">
                      <div class="p-3 text-center bg-white">
                        <img :src="fig.url" class="img-fluid rounded" :alt="fig.label" style="max-height: 400px;">
                      </div>
                      <div class="card-body">
                        <div class="fw-bold text-primary small mb-1">{{ fig.label }}</div>
                        <div class="small text-muted" style="line-height: 1.4;">{{ fig.caption }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

interface PublishedPost {
  id: number
  title: string
  content: string
  date: string
  figures?: any[]
}

const publishedPosts = ref<PublishedPost[]>([])

function loadPosts() {
  const posts = JSON.parse(localStorage.getItem('published_blog_posts') || '[]')
  publishedPosts.value = posts
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function renderMarkdown(text: string) {
  return marked.parse(text)
}

onMounted(() => {
  loadPosts()
  
  // Listen for storage changes in other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'published_blog_posts') {
      loadPosts()
    }
  })
})
</script>

<style scoped lang="scss">
.blog-card {
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px);
  }
}

.markdown-content {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #2d3748;

  :deep(h1), :deep(h2), :deep(h3) {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: bold;
    color: var(--bs-primary);
  }

  :deep(p) {
    margin-bottom: 1.25rem;
  }

  :deep(ul), :deep(ol) {
    margin-bottom: 1.5rem;
    padding-left: 1.5rem;
  }

  :deep(li) {
    margin-bottom: 0.5rem;
  }

  :deep(strong) {
    color: #1a202c;
  }
}
</style>
