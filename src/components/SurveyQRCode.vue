<template>
  <div class="survey-qr-code text-center p-4 border rounded bg-white shadow-sm">
    <h5 class="mb-3 fw-bold">Obecná zpětná vazba</h5>
    <p class="text-muted small mb-4">
      Požádejte pacienta o vyplnění obecné zpětné vazby k sezení.
    </p>

    <div class="qr-container d-flex justify-content-center mb-4 p-3 bg-light rounded">
      <QrcodeVue :value="surveyUrl" :size="200" level="H" class="shadow-sm" />
    </div>

    <div
      class="url-copy p-2 bg-light rounded small text-muted text-truncate mb-3 d-flex align-items-center gap-2"
    >
      <i class="bi bi-link-45deg"></i>
      <span class="text-truncate">{{ surveyUrl }}</span>
    </div>

    <button
      class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
      @click="copyUrl"
    >
      <i class="bi bi-clipboard"></i>
      {{ copied ? 'Zkopírováno' : 'Kopírovat odkaz' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps<{
  sessionId: string
  patientId?: string
  patientName?: string
  doctorId?: string
  clinicId?: string
}>()

const copied = ref(false)

// Helper to ensure IDs are short (8 chars) if they look like UUIDs
const toShortId = (id: string | undefined, prefix: string) => {
  if (!id) return `${prefix}-${Math.random().toString(36).substring(2, 7)}`
  const cleanId = id.includes('-') ? id.split('-')[0] : id
  return `${prefix}-${(cleanId || '').substring(0, 8)}`
}

const surveyUrl = computed(() => {
  const baseUrl = `${window.location.origin}/#/patients/survey/general`
  const params = new URLSearchParams()
  
  if (props.sessionId) params.set('sessionId', toShortId(props.sessionId, 'SES'))
  if (props.patientId) params.set('patientId', toShortId(props.patientId, 'PAT'))
  if (props.doctorId) params.set('doctorId', toShortId(props.doctorId, 'DOC'))
  if (props.clinicId) params.set('clinicId', toShortId(props.clinicId, 'CLI'))
  if (props.patientName) params.set('name', props.patientName)
  
  const query = params.toString()
  return query ? `${baseUrl}?${query}` : baseUrl
})

function copyUrl() {
  navigator.clipboard.writeText(surveyUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<style scoped>
.qr-container {
  display: inline-block;
}
</style>
