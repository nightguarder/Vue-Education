import { ref } from 'vue'
import { storageService } from '@/services/storageService'
import type { Patient, ClinicalSession } from '@/services/doctorApi'

export function useClinicalData() {
  const isCreating = ref(false)
  const lastCreatedPatient = ref<Patient | null>(null)
  const lastCreatedSession = ref<ClinicalSession | null>(null)
  const error = ref<string | null>(null)

  /**
   * Creates a new patient record.
   */
  async function createPatient(data: Partial<Patient>) {
    isCreating.value = true
    error.value = null
    try {
      const patient = await storageService.createPatient(data)
      lastCreatedPatient.value = patient
      return patient
    } catch (e: any) {
      error.value = e.message || 'Failed to create patient'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Creates a new clinical session.
   */
  async function createSession(patientId: string, initialData: any = {}) {
    isCreating.value = true
    error.value = null
    try {
      const session = await storageService.createSession({
        patient_id: patientId,
        ...initialData
      })
      lastCreatedSession.value = session
      return session
    } catch (e: any) {
      error.value = e.message || 'Failed to create session'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * High-level helper to start a new session (with optional patient creation).
   */
  async function startNewSession(params: {
    patientId?: string
    patientData?: Partial<Patient>
    transcript?: string
    notes?: string
  }) {
    isCreating.value = true
    error.value = null
    try {
      let patientId = params.patientId
      let patientName = ''
      let patientAge: number | undefined
      let patientGender = ''

      if (!patientId && params.patientData) {
        const p = await createPatient(params.patientData)
        patientId = p.patient_id
        patientName = p.name
        patientAge = p.age
        patientGender = p.gender || ''
      } else if (patientId) {
        const patients = await fetchPatients()
        const p = patients.find(p => p.patient_id === patientId || (p as any).id === patientId)
        if (p) {
          patientName = p.name
          patientAge = p.age
          patientGender = p.gender || ''
        }
      }

      if (!patientId) throw new Error('Patient information is required to start a session.')

      const now = new Date().toISOString()
      const systemMsg = `Patient: ${patientName}${patientAge ? `, Age: ${patientAge}` : ''}${patientGender ? `, Gender: ${patientGender}` : ''}${params.notes ? `\nNotes: ${params.notes}` : ''}`
      
      const messages = [
        { role: 'system', content: systemMsg, timestamp: now }
      ]

      const session = await createSession(patientId, {
        transcript: params.transcript || '',
        status: 'active',
        analysis: {
          patientName,
          patientAge,
          patientGender,
          patientNotes: params.notes,
          lastActivity: now,
          messages
        }
      })

      return { patientId, session }
    } catch (e: any) {
      error.value = e.message || 'Failed to start new session'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * High-level helper to append a transcript to an existing session.
   */
  async function appendTranscript(sessionId: string, transcript: string) {
    isCreating.value = true
    error.value = null
    try {
      const sessions = await fetchSessions()
      const session = sessions.find(s => s.session_id === sessionId)
      if (!session) throw new Error('Session not found')

      const now = new Date().toISOString()
      session.transcript = (session.transcript ? session.transcript + '\n\n' : '') + transcript
      session.status = 'active'

      let analysis = session.ai_analysis
      if (typeof analysis === 'string') analysis = JSON.parse(analysis)
      if (!analysis) analysis = {}

      analysis.lastActivity = now

      session.ai_analysis = analysis
      await saveSession(session)
      return session
    } catch (e: any) {
      error.value = e.message || 'Failed to append transcript'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Updates an existing patient record.
   */
  async function savePatient(patient: Patient) {
    isCreating.value = true
    error.value = null
    try {
      await storageService.savePatient(patient)
    } catch (e: any) {
      error.value = e.message || 'Failed to save patient'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Updates an existing clinical session.
   */
  async function saveSession(session: ClinicalSession) {
    isCreating.value = true
    error.value = null
    try {
      await storageService.saveSession(session)
    } catch (e: any) {
      error.value = e.message || 'Failed to save session'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Fetches all patients.
   */
  async function fetchPatients() {
    return await storageService.getPatients()
  }

  /**
   * Fetches all clinical sessions.
   */
  async function fetchSessions() {
    return await storageService.getSessions()
  }

  /**
   * Fetches all worksheets.
   */
  async function fetchWorksheets(patientId?: string) {
    return await storageService.getWorksheets(patientId)
  }

  /**
   * Creates a new worksheet.
   */
  async function createWorksheet(data: { patient_id: string; session_id: string; content: any }) {
    isCreating.value = true
    error.value = null
    try {
      await storageService.createWorksheet(data)
    } catch (e: any) {
      error.value = e.message || 'Failed to create worksheet'
      throw e
    } finally {
      isCreating.value = false
    }
  }

  /**
   * Deletes a worksheet.
   */
  async function deleteWorksheet(id: string) {
    try {
      await storageService.deleteWorksheet(id)
    } catch (e: any) {
      error.value = e.message || 'Failed to delete worksheet'
      throw e
    }
  }

  /**
   * Deletes a patient.
   */
  async function deletePatient(patientId: string) {
    try {
      await storageService.deletePatient(patientId)
    } catch (e: any) {
      error.value = e.message || 'Failed to delete patient'
      throw e
    }
  }

  /**
   * Deletes a clinical session.
   */
  async function deleteSession(sessionId: string) {
    try {
      await storageService.deleteSession(sessionId)
    } catch (e: any) {
      error.value = e.message || 'Failed to delete session'
      throw e
    }
  }

  return {
    isCreating,
    lastCreatedPatient,
    lastCreatedSession,
    error,
    createPatient,
    createSession,
    startNewSession,
    appendTranscript,
    savePatient,
    saveSession,
    deletePatient,
    deleteSession,
    fetchPatients,
    fetchSessions,
    fetchWorksheets,
    createWorksheet,
    deleteWorksheet
  }
}

