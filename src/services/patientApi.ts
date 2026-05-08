// Patient API service - TypeScript version
export interface WorksheetField {
  id: string
  type: 'textarea' | 'slider' | 'checkbox'
  label: string
  placeholder?: string
  min?: number
  max?: number
  value?: number
}

export interface Worksheet {
  id: number
  title: string
  type: string
  intro?: string
  fields?: WorksheetField[]
  pdfUrl?: string
  instruction?: string
  assignedAt?: string
  completed?: boolean
  responseData?: Record<string, any>
  submittedAt?: string
}

export interface PatientData {
  worksheets: Worksheet[]
}

export interface WorksheetResponse {
  success: boolean
  message: string
  timestamp: string
}

const API_BASE = '/api'

export const patientApi = {
  /**
   * Fetches patient data (worksheets and audio clips) using a secure token
   */
  async getPatientData(token: string): Promise<PatientData> {
    try {
      const response = await fetch(`${API_BASE}/worksheets?patient_id=${token}`)
      if (!response.ok) throw new Error('Failed to fetch worksheets')
      const worksheets = await response.json()
      
      return { worksheets: worksheets || [] }
    } catch (e) {
      console.error('[PatientAPI] Fetch error:', e)
      // Fallback to empty state but could also check localStorage if desired
      return { worksheets: [] }
    }
  },

  /**
   * Submits completed worksheet data
   */
  async submitWorksheet(worksheetData: { patient_id: string; worksheet_id: number; responses: any }): Promise<WorksheetResponse> {
    const response = await fetch(`${API_BASE}/worksheets/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worksheetData)
    })
    
    if (!response.ok) throw new Error('Submission failed')
    return await response.json()
  },

  /**
   * Submits feedback data (General Survey)
   */
  async submitFeedback(feedbackData: any): Promise<WorksheetResponse> {
    const response = await fetch(`${API_BASE}/surveys/general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    })
    
    if (!response.ok) throw new Error('Feedback submission failed')
    return await response.json()
  },

  /**
   * Submits Personalized Survey
   */
  async submitPersonalizedSurvey(surveyData: any): Promise<WorksheetResponse> {
    const response = await fetch(`${API_BASE}/surveys/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData)
    })
    
    if (!response.ok) throw new Error('Personalized survey submission failed')
    return await response.json()
  }
}
