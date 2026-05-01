<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-0">Your Worksheets</h4>
            <p class="card-text text-muted mb-0 small">Print your home exercises and worksheets assigned by your therapist.</p>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3">Loading worksheets...</p>
            </div>

            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <div v-else-if="worksheets.length === 0" class="text-center py-5">
              <i class="bi bi-journal-text display-4 text-muted mb-4"></i>
              <h5>No worksheets found</h5>
              <p class="text-muted">Ask your therapist to assign some worksheets through the doctor portal.</p>
            </div>

            <div v-else class="row g-4">
              <div v-for="worksheet in worksheets" :key="worksheet.id" class="col-md-6">
                <div class="card h-100 shadow-sm border-0">
                  <div class="card-body d-flex flex-column">
                    <div class="flex-grow-1">
                      <h5 class="card-title">{{ worksheet.title }}</h5>
                      <p class="card-text text-muted small">
                        {{ worksheet.assignedAt ? new Date(worksheet.assignedAt).toLocaleDateString() : '' }}
                      </p>

                      <div v-if="worksheet.instruction" class="alert alert-info mt-3 small">
                        <i class="bi bi-lightbulb me-2"></i>
                        {{ worksheet.instruction }}
                      </div>
                    </div>

                    <div class="d-grid gap-2 mt-3">
                      <button v-if="worksheet.fields" @click="startInteractive(worksheet)" class="btn btn-primary btn-sm">
                        <i class="bi bi-pencil-square me-1"></i> Fill Online or Print
                      </button>

                      <button v-if="worksheet.pdfUrl" @click="viewPdf(worksheet)" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-eye me-1"></i> View PDF
                      </button>

                      <button v-if="worksheet.pdfUrl" @click="printPdf(worksheet)" class="btn btn-outline-success btn-sm">
                        <i class="bi bi-printer me-1"></i> Print
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { patientApi } from '@/services/patientApi'
import type { Worksheet } from '@/services/patientApi'

const route = useRoute()
const worksheets = ref<Worksheet[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const patientToken = ref(route.query.token as string || 'mock-token-123')

onMounted(() => {
  fetchWorksheets()
})

async function fetchWorksheets() {
  try {
    loading.value = true
    const data = await patientApi.getPatientData(patientToken.value)
    worksheets.value = data.worksheets || []

    worksheets.value.forEach((ws, i) => {
      if (!ws.instruction) {
        ws.instruction = `Hello, try filling this out before your doctor's appointment.`
      }
      if (!ws.assignedAt) {
        ws.assignedAt = new Date(Date.now() - i * 86400000).toISOString()
      }
    })
  } catch (err) {
    error.value = 'Failed to load worksheets.'
  } finally {
    loading.value = false
  }
}

function startInteractive(worksheet: Worksheet) {
  console.log('Start interactive:', worksheet)
  // Will be implemented with WorksheetForm component later
}

function viewPdf(worksheet: Worksheet) {
  window.open(worksheet.pdfUrl, '_blank')
}

function printPdf(worksheet: Worksheet) {
  window.open(worksheet.pdfUrl, '_blank')
  alert('PDF opened in new tab. Use Ctrl+P to print.')
}
</script>

<style scoped>
.card-header { background-color: #f8f9fa !important; }
.card-title { font-size: 1.1rem; font-weight: 600; }
.btn-sm { border-radius: 20px; padding: 0.4rem 0.8rem; font-size: 0.85rem; }
.alert-info { border-radius: 8px; font-size: 0.85rem; }
</style>
