<template>
  <div class="container-fluid py-3 px-3">
    <!-- Breadcrumb / Back Navigation -->
    <div class="row mb-3">
      <div class="col-12">
        <router-link to="/patients/home" class="text-decoration-none text-muted d-flex align-items-center">
          <i class="bi bi-arrow-left me-2"></i> Zpět na přehled
        </router-link>
      </div>
    </div>
    
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-sm border-0 rounded-4">
          <div class="card-header bg-white border-bottom py-3">
            <h4 class="card-title mb-0">Audio knihovna</h4>
            <p class="card-text text-muted mb-0 small">
              Vedené meditace a dechová cvičení pro vaše zklidnění.
            </p>
          </div>
          <div class="card-body py-4">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Načítání...</span>
              </div>
            </div>

            <div v-else class="list-group list-group-flush">
              <div v-for="clip in audioClips" :key="clip.id" class="list-group-item px-0 py-3 border-bottom">
                <div class="d-flex align-items-center">
                  <div class="flex-shrink-0 me-3">
                    <button class="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                      <i class="bi bi-play-fill fs-4"></i>
                    </button>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold">{{ clip.title }}</h6>
                    <small class="text-muted">{{ clip.duration }}</small>
                  </div>
                  <div class="flex-shrink-0">
                    <button class="btn btn-link text-muted p-0">
                      <i class="bi bi-download fs-5"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="alert alert-light border mt-4 mb-0 rounded-3">
              <div class="d-flex">
                <i class="bi bi-info-circle text-primary me-3 fs-5"></i>
                <div class="small">
                  Poslech těchto nahrávek nenahrazuje terapeutické sezení, ale slouží jako podpora mezi nimi.
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
import { patientApi } from '@/services/patientApi'
import type { AudioClip } from '@/services/patientApi'

const audioClips = ref<AudioClip[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await patientApi.getPatientData('mock-token')
    audioClips.value = data.audioClips
  } catch (e) {
    console.error('Failed to fetch audio clips', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
@use "sass:color";

.btn-primary {
  background-color: $primary-color;
  border-color: $primary-color;
  &:hover {
    background-color: color.adjust($primary-color, $lightness: -10%);
    border-color: color.adjust($primary-color, $lightness: -10%);
  }
}
</style>
