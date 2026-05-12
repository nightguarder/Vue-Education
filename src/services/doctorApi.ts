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
  }
}
