<script setup lang="ts">
import { ref } from 'vue'

interface Infographic {
  id: number
  title: string
  description: string
  imageUrl: string
  category: string
}

const infographics = ref<Infographic[]>([
  {
    id: 1,
    title: 'Péče o duševní zdraví',
    description: 'Základní principy pro udržení duševní pohody v každodenním životě.',
    imageUrl: 'https://placehold.co/600x848?text=Infografika+1',
    category: 'Prevence'
  },
  {
    id: 2,
    title: 'Techniky zvládání úzkosti',
    description: 'Praktické cviky a dechová cvičení pro okamžitou pomoc při úzkosti.',
    imageUrl: 'https://placehold.co/600x848?text=Infografika+2',
    category: 'Cvičení'
  },
  {
    id: 3,
    title: 'Spánková hygiena',
    description: 'Jak zlepšit kvalitu spánku a podpořit regeneraci organismu.',
    imageUrl: 'https://placehold.co/600x848?text=Infografika+3',
    category: 'Životní styl'
  }
])

const activeInfographic = ref<Infographic | null>(null)

const openModal = (info: Infographic) => {
  activeInfographic.value = info
}
</script>

<template>
  <div class="infographics-view container py-5">
    <div class="row mb-5">
      <div class="col-12 text-center">
        <h1 class="display-5 fw-bold mb-3">Vzdělávací infografiky</h1>
        <p class="lead text-muted">
          Prohlédněte si a stáhněte vzdělávací materiály ve formátu DIN A4.
        </p>
      </div>
    </div>

    <div class="row g-4">
      <div v-for="info in infographics" :key="info.id" class="col-md-6 col-lg-4">
        <div class="infographic-card h-100 shadow-sm border-0" @click="openModal(info)">
          <div class="position-relative overflow-hidden card-img-container">
            <img :src="info.imageUrl" :alt="info.title" class="card-img-top">
            <div class="overlay">
              <i class="bi bi-zoom-in fs-1 text-white"></i>
            </div>
            <span class="category-badge">{{ info.category }}</span>
          </div>
          <div class="card-body p-4">
            <h5 class="card-title fw-bold mb-2">{{ info.title }}</h5>
            <p class="card-text text-muted small mb-3">{{ info.description }}</p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <button class="btn btn-outline-primary btn-sm">
                <i class="bi bi-eye me-1"></i> Náhled
              </button>
              <a :href="info.imageUrl" download class="btn btn-primary btn-sm">
                <i class="bi bi-download me-1"></i> Stáhnout
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Preview (using standard Bootstrap Modal classes) -->
    <div v-if="activeInfographic" class="modal-backdrop fade show"></div>
    <div v-if="activeInfographic" class="modal fade show d-block" @click.self="activeInfographic = null">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">{{ activeInfographic.title }}</h5>
            <button type="button" class="btn-close" @click="activeInfographic = null"></button>
          </div>
          <div class="modal-body text-center p-4">
            <img :src="activeInfographic.imageUrl" :alt="activeInfographic.title" class="img-fluid rounded shadow-sm a4-preview">
            <p class="mt-4 text-muted">{{ activeInfographic.description }}</p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <a :href="activeInfographic.imageUrl" download class="btn btn-primary w-100 py-2">
              <i class="bi bi-download me-2"></i> Stáhnout verzi pro tisk (DIN A4)
            </a>
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 20px;
  overflow: hidden;
  background: white;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important;

    .overlay {
      opacity: 1;
    }
    
    .card-img-top {
      transform: scale(1.05);
    }
  }
}

.card-img-container {
  aspect-ratio: 1 / 1.414; // DIN A4 Aspect Ratio
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-img-top {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
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
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  color: $primary-color;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.a4-preview {
  max-height: 70vh;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.modal-backdrop {
  background-color: rgba(0,0,0,0.6);
}

.modal-content {
  border-radius: 25px;
}
</style>
