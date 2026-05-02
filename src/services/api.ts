// API service for education-patients database
// Works with both local (Colima) and production (InfinityFree PHP API)

const getApiBase = (): string => {
  const isProd = import.meta.env.PROD
  return isProd
    ? 'https://your-infinityfree-domain.com/api' // TODO: Replace with your InfinityFree domain
    : '/api' // Proxied by Vite in dev mode
}

// Types
export interface Patient {
  patient_id: string
  name?: string
  email?: string
}

export interface WorksheetTemplate {
  template_id: string
  title: string
  type: string
  fields: any[]
}

export interface PatientWorksheet {
  id?: number
  patient_id: string
  template_id: string
  custom_questions?: any[]
  status: 'pending' | 'in_progress' | 'completed'
  assigned_at?: string
  completed_at?: string
}

export interface WorksheetResponse {
  id?: number
  worksheet_id: number
  patient_id: string
  responses: Record<string, any>
  submitted_at?: string
}

// API Functions

export async function fetchPatientWorksheets(patientId: string): Promise<PatientWorksheet[]> {
  const response = await fetch(`${getApiBase()}/worksheets?patient_id=${encodeURIComponent(patientId)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch worksheets: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchWorksheetTemplates(): Promise<WorksheetTemplate[]> {
  const response = await fetch(`${getApiBase()}/templates`, {
    headers: {
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch templates: ${response.statusText}`)
  }

  return response.json()
}

export async function submitWorksheetResponse(
  patientId: string,
  worksheetId: number,
  responsesData: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${getApiBase()}/worksheets/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_id: patientId,
      worksheet_id: worksheetId,
      responses: responsesData
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to submit worksheet: ${response.statusText}`)
  }

  return response.json()
}

export async function createPatient(patient: Patient): Promise<{ success: boolean }> {
  const response = await fetch(`${getApiBase()}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patient)
  })

  if (!response.ok) {
    throw new Error(`Failed to create patient: ${response.statusText}`)
  }

  return response.json()
}
