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
  async getSessions(patientId?: string, doctorId?: string): Promise<ClinicalSession[]> {
    let url = `${API_BASE}/sessions`
    const params = new URLSearchParams()
    if (patientId) params.append('patient_id', patientId)
    if (doctorId) params.append('doctor_id', doctorId)
    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch sessions')
    return await response.json()
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete session')
    return await response.json()
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

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch patients')
    return await response.json()
  },

  /**
   * Get a single patient by ID
   */
  async getPatient(patientId: string): Promise<Patient> {
    const response = await fetch(`${API_BASE}/patients/${patientId}`)
    if (!response.ok) throw new Error('Failed to fetch patient')
    return await response.json()
  },

  /**
   * Save or update a patient record
   */
  async savePatient(patient: Patient): Promise<any> {
    const response = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    })
    if (!response.ok) throw new Error('Failed to save patient')
    return await response.json()
  },

  /**
   * Delete a patient (soft delete)
   */
  async deletePatient(patientId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/patients/${patientId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete patient')
    return await response.json()
  },

  /**
   * --- OTHER ---
   */
  async getSurveys(doctorId?: string, type: 'all' | 'general' | 'personalized' = 'all'): Promise<any[]> {
    const url = `${API_BASE}/surveys?type=${type}${doctorId ? `&doctor_id=${doctorId}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch surveys')
    return await response.json()
  },

  /**
   * Get all worksheets
   */
  async getWorksheets(patientId?: string): Promise<any[]> {
    let url = `${API_BASE}/worksheets`
    if (patientId) url += `?patient_id=${patientId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch worksheets')
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
  },

  /**
   * Delete a worksheet
   */
  async deleteWorksheet(id: string): Promise<any> {
    const response = await fetch(`${API_BASE}/worksheets/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete worksheet')
    return await response.json()
  },

  /**
   * Get vacation settings (total days, used, etc.)
   */
  async getVacationSettings(doctorId: string = 'DOC-default'): Promise<any> {
    const response = await fetch(`${API_BASE}/vacations/settings?doctor_id=${doctorId}`)
    if (!response.ok) throw new Error('Failed to fetch vacation settings')
    return await response.json()
  },

  /**
   * Update vacation settings
   */
  async updateVacationSettings(doctorId: string = 'DOC-default', settings: { total_days: number }): Promise<any> {
    const response = await fetch(`${API_BASE}/vacations/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: doctorId, ...settings })
    })
    if (!response.ok) throw new Error('Failed to update vacation settings')
    return await response.json()
  },

  /**
   * Get all vacations for a doctor
   */
  async getVacations(doctorId: string = 'DOC-default'): Promise<any[]> {
    const response = await fetch(`${API_BASE}/vacations?doctor_id=${doctorId}`)
    if (!response.ok) throw new Error('Failed to fetch vacations')
    return await response.json()
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
    const response = await fetch(`${API_BASE}/vacations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacation)
    })
    if (!response.ok) throw new Error('Failed to add vacation')
    return await response.json()
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
    const response = await fetch(`${API_BASE}/vacations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update vacation')
    return await response.json()
  },

  /**
   * Delete a vacation
   */
  async deleteVacation(id: number): Promise<any> {
    const response = await fetch(`${API_BASE}/vacations/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete vacation')
    return await response.json()
  },

  /**
   * Get all published blog posts
   */
  async getBlogPosts(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/blog-posts`)
    if (!response.ok) throw new Error('Failed to fetch blog posts')
    return await response.json()
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
    const response = await fetch(`${API_BASE}/blog-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
    if (!response.ok) throw new Error('Failed to publish blog post')
    return await response.json()
  },

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: number): Promise<any> {
    const response = await fetch(`${API_BASE}/blog-posts/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete blog post')
    return await response.json()
  },

  /**
   * Save a survey response
   */
  async saveSurvey(survey: any): Promise<any> {
    const response = await fetch(`${API_BASE}/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    })
    if (!response.ok) throw new Error('Failed to save survey')
    return await response.json()
  }
}
