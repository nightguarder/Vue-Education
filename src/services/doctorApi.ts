const API_BASE = '/api'

/**
 * Robust fetch wrapper that handles non-JSON responses (e.g. InfinityFree security pages)
 */
async function safeFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    
    // Detect InfinityFree security challenge
    if (text.includes('aes.js') || text.includes('__test')) {
      throw new Error('Security challenge active. Please refresh the page.')
    }

    console.warn('Expected JSON but received:', text.substring(0, 100))
    throw new Error('Server returned invalid data format (HTML instead of JSON)')
  }

  return await response.json()
}

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
  messages?: ChatMessage[]
}

export interface Patient {
  id?: number
  patient_id: string
  doctor_id?: string
  clinic_id?: string
  name: string
  email?: string
  phone?: string
  age?: number
  gender?: string
  notes?: string
  created_at?: string
}

export const doctorApi = {
  /**
   * --- SESSIONS ---
   */

  /**
   * Saves or updates a clinical session
   */
  async saveSession(session: ClinicalSession): Promise<any> {
    return await safeFetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    })
  },

  /**
   * Fetches sessions for a doctor or patient
   */
  async getSessions(patientId?: string, doctorId?: string): Promise<ClinicalSession[]> {
    let url = `${API_BASE}/sessions`
    const params = new URLSearchParams()
    if (patientId) params.append('patient_id', patientId)
    if (doctorId) params.append('doctor_id', doctorId)
    if (params.toString()) url += `?${params.toString()}`

    return await safeFetch(url)
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<any> {
    return await safeFetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE'
    })
  },

  /**
   * --- PATIENTS ---
   */

  /**
   * Get all patients for a doctor
   */
  async getPatients(doctorId?: string, query?: string): Promise<Patient[]> {
    let url = `${API_BASE}/patients`
    const params = new URLSearchParams()
    if (doctorId) params.append('doctor_id', doctorId)
    if (query) params.append('q', query)
    if (params.toString()) url += `?${params.toString()}`

    return await safeFetch(url)
  },

  /**
   * Get a single patient by ID
   */
  async getPatient(patientId: string): Promise<Patient> {
    return await safeFetch(`${API_BASE}/patients/${patientId}`)
  },

  /**
   * Save or update a patient record
   */
  async savePatient(patient: Patient): Promise<any> {
    return await safeFetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    })
  },

  /**
   * Delete a patient (soft delete)
   */
  async deletePatient(patientId: string): Promise<any> {
    return await safeFetch(`${API_BASE}/patients/${patientId}`, {
      method: 'DELETE'
    })
  },

  /**
   * --- OTHER ---
   */
  async getSurveys(doctorId?: string, type: 'all' | 'general' | 'personalized' = 'all'): Promise<any[]> {
    const url = `${API_BASE}/surveys?type=${type}${doctorId ? `&doctor_id=${doctorId}` : ''}`
    return await safeFetch(url)
  },

  /**
   * Get all worksheets
   */
  async getWorksheets(patientId?: string): Promise<any[]> {
    let url = `${API_BASE}/worksheets`
    if (patientId) url += `?patient_id=${patientId}`
    return await safeFetch(url)
  },

  /**
   * Creates a dynamic worksheet for a patient
   */
  async createWorksheet(data: { patient_id: string; session_id: string; content: any }): Promise<any> {
    return await safeFetch(`${API_BASE}/worksheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },

  /**
   * Delete a worksheet
   */
  async deleteWorksheet(id: string): Promise<any> {
    return await safeFetch(`${API_BASE}/worksheets/${id}`, {
      method: 'DELETE'
    })
  },

  /**
   * Get vacation settings (total days, used, etc.)
   */
  async getVacationSettings(doctorId: string = 'DOC-default'): Promise<any> {
    return await safeFetch(`${API_BASE}/vacations/settings?doctor_id=${doctorId}`)
  },

  /**
   * Update vacation settings
   */
  async updateVacationSettings(doctorId: string = 'DOC-default', settings: { total_days: number }): Promise<any> {
    return await safeFetch(`${API_BASE}/vacations/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: doctorId, ...settings })
    })
  },

  /**
   * Get all vacations for a doctor
   */
  async getVacations(doctorId: string = 'DOC-default'): Promise<any[]> {
    return await safeFetch(`${API_BASE}/vacations?doctor_id=${doctorId}`)
  },

  /**
   * Add a new vacation
   */
  async addVacation(vacation: {
    doctor_id: string
    start_date: string
    end_date: string
    reason: 'vacation' | 'sick' | 'personal' | 'other'
  }): Promise<any> {
    return await safeFetch(`${API_BASE}/vacations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacation)
    })
  },

  /**
   * Update an existing vacation
   */
  async updateVacation(id: number, updates: {
    start_date?: string
    end_date?: string
    reason?: string
    status?: 'active' | 'cancelled'
  }): Promise<any> {
    return await safeFetch(`${API_BASE}/vacations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
  },

  /**
   * Delete a vacation
   */
  async deleteVacation(id: number): Promise<any> {
    return await safeFetch(`${API_BASE}/vacations/${id}`, {
      method: 'DELETE'
    })
  },

  /**
   * Get all published blog posts
   */
  async getBlogPosts(): Promise<any[]> {
    return await safeFetch(`${API_BASE}/blog-posts`)
  },

  /**
   * Publish a new blog post
   */
  async publishBlogPost(post: {
    title: string
    content: string
    type?: string
    figures?: any[]
  }): Promise<any> {
    return await safeFetch(`${API_BASE}/blog-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
  },

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: number): Promise<any> {
    return await safeFetch(`${API_BASE}/blog-posts/${id}`, {
      method: 'DELETE'
    })
  },

  /**
   * Save a survey response
   */
  async saveSurvey(survey: any): Promise<any> {
    return await safeFetch(`${API_BASE}/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    })
  }
}
