// Patient API service - TypeScript version
import { storageService } from './storageService'

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
      const worksheets = await storageService.getWorksheets(token)
      return { worksheets: worksheets || [] }
    } catch (e) {
      console.error('[PatientAPI] Fetch error:', e)
      return { worksheets: [] }
    }
  },

  /**
   * Submits completed worksheet data
   */
  async submitWorksheet(worksheetData: { patient_id: string; worksheet_id: number; responses: any }): Promise<WorksheetResponse> {
    try {
      // Save as a "survey" type for now or we could add a specific method to storageService
      await storageService.saveSurvey({
        ...worksheetData,
        type: 'worksheet_response',
        created_at: new Date().toISOString()
      })
      
      return {
        success: true,
        message: 'Uloženo lokálně (bude synchronizováno)',
        timestamp: new Date().toISOString()
      }
    } catch (e: any) {
      throw new Error('Nepodařilo se uložit data: ' + e.message)
    }
  },

  /**
   * Submits feedback data (General Survey)
   */
  async submitFeedback(feedbackData: any): Promise<WorksheetResponse> {
    try {
      await storageService.saveSurvey({
        ...feedbackData,
        type: 'general_feedback',
        created_at: new Date().toISOString()
      })
      
      return {
        success: true,
        message: 'Zpětná vazba uložena lokálně',
        timestamp: new Date().toISOString()
      }
    } catch (e: any) {
      throw new Error('Nepodařilo se uložit zpětnou vazbu: ' + e.message)
    }
  },

  /**
   * Submits Personalized Survey
   */
  async submitPersonalizedSurvey(surveyData: any): Promise<WorksheetResponse> {
    try {
      await storageService.saveSurvey({
        ...surveyData,
        type: 'personalized_survey',
        created_at: new Date().toISOString()
      })
      
      return {
        success: true,
        message: 'Průzkum uložen lokálně',
        timestamp: new Date().toISOString()
      }
    } catch (e: any) {
      throw new Error('Nepodařilo se uložit průzkum: ' + e.message)
    }
  }
}
