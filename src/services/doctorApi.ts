const API_BASE = '/api'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface ClinicalSession {
  id?: number
  session_id: string
  patient_id: string
  doctor_id?: string
  clinic_id?: string
  transcript?: string
  ai_analysis?: any
  created_at?: string
  status?: 'pending' | 'completed' | 'active'
  messages?: ChatMessage[] // We might store messages in ai_analysis or a separate column
}

export const doctorApi = {
  /**
   * Saves or updates a clinical session
   */
  async saveSession(session: ClinicalSession): Promise<any> {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    })
    if (!response.ok) throw new Error('Failed to save session')
    return await response.json()
  },

  /**
   * Fetches sessions for a doctor or patient
   */
  async getSessions(patientId?: string): Promise<ClinicalSession[]> {
    const url = patientId ? `${API_BASE}/sessions?patient_id=${patientId}` : `${API_BASE}/sessions`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch sessions')
    return await response.json()
  },

  /**
   * Fetches all surveys for review
   */
  async getSurveys(doctorId?: string, type: 'all' | 'general' | 'personalized' = 'all'): Promise<any[]> {
    const url = `${API_BASE}/surveys?type=${type}${doctorId ? `&doctor_id=${doctorId}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch surveys')
    return await response.json()
  },

  /**
   * Creates a dynamic worksheet for a patient
   */
  async createWorksheet(data: { patient_id: string; session_id: string; content: any }): Promise<any> {
    const response = await fetch(`${API_BASE}/worksheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create worksheet')
    return await response.json()
  }
}
