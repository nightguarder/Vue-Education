<template>
  <nav v-if="breadcrumbs.length > 0" class="breadcrumb-nav mb-4 px-3" aria-label="breadcrumb">
    <ol class="breadcrumb py-2 px-3 rounded-pill bg-white shadow-sm border mb-0">
      <li class="breadcrumb-item d-flex align-items-center">
        <router-link to="/" class="text-decoration-none text-muted hover-primary">
          <i class="bi bi-house-door-fill me-1"></i>
        </router-link>
      </li>
      <li 
        v-for="(crumb, index) in breadcrumbs" 
        :key="crumb.path" 
        class="breadcrumb-item d-flex align-items-center"
        :class="{ active: index === breadcrumbs.length - 1 }"
        :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined"
      >
        <router-link 
          v-if="index < breadcrumbs.length - 1" 
          :to="crumb.path" 
          class="text-decoration-none text-muted hover-primary fw-medium"
        >
          {{ crumb.name }}
        </router-link>
        <span v-else class="fw-bold text-primary">
          {{ crumb.name }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

interface Breadcrumb {
  name: string
  path: string
}

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const path = route.path
  if (path === '/') return []

  const parts = path.split('/').filter(p => p)
  const crumbs: Breadcrumb[] = []
  let currentPath = ''

  parts.forEach((part, index) => {
    currentPath += `/${part}`
    
    // Skip UUIDs or IDs in breadcrumbs
    if (part.length > 20 && /[0-9a-f]{8}-[0-9a-f]{4}/.test(part)) {
        return
    }

    crumbs.push({
      name: formatName(part),
      path: currentPath
    })
  })

  return crumbs
})

function formatName(pathPart: string): string {
  // Map specific paths to better names
  const mapping: Record<string, string> = {
    'patients': 'Patient Portal',
    'doctor': 'Doctor Portal',
    'home': 'Home',
    'worksheets': 'Worksheets',
    'stress': 'Stress Relief',
    'resources': 'Resources',
    'audio': 'Audio Library',
    'infographics': 'Infographics',
    'feedback': 'Feedback',
    'education': 'Education',
    'research': 'Research',
    'transcription': 'Transcription',
    'chat': 'Clinical Sessions',
    'settings': 'Settings'
  }

  return mapping[pathPart.toLowerCase()] || 
         pathPart.charAt(0).toUpperCase() + pathPart.slice(1).replace(/-/g, ' ')
}
</script>

<style scoped lang="scss">
.breadcrumb-nav {
  animation: fadeInDown 0.4s ease-out;
}

.breadcrumb {
  display: inline-flex;
  font-size: 0.9rem;
}

.breadcrumb-item {
  &::before {
    float: left;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
    color: #cbd5e0;
    content: "/";
  }

  &:first-child::before {
    display: none;
  }
}

.hover-primary:hover {
  color: var(--bs-primary) !important;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
