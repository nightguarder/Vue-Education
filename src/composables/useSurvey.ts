import { ref, computed } from 'vue'
import { doctorApi } from '@/services/doctorApi'

export function useSurvey() {
  const surveys = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSurveys() {
    isLoading.value = true
    error.value = null
    try {
      surveys.value = await doctorApi.getSurveys()
    } catch (e: any) {
      error.value = e.message || 'Nepodařilo se načíst průzkumy'
      console.error('[useSurvey] Fetch failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  const getSurveysByPatient = (patientId: string) => {
    return computed(() => {
      // Handle the case where patientId might be prefixed with PAT-
      const shortId = patientId.includes('-') ? patientId.split('-')[1] : patientId
      return surveys.value.filter(s => {
        const sPatId = s.patient_id || ''
        return sPatId.includes(shortId || '')
      })
    })
  }

  const getSurveysBySession = (sessionId: string) => {
    return computed(() => {
      const shortId = sessionId.includes('-') ? sessionId.split('-')[1] : sessionId
      return surveys.value.filter(s => {
        const sSesId = s.session_id || ''
        return sSesId.includes(shortId || '')
      })
    })
  }

  return {
    surveys,
    isLoading,
    error,
    fetchSurveys,
    getSurveysByPatient,
    getSurveysBySession
  }
}
