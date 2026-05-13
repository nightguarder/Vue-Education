import { ref, computed } from 'vue'
import { doctorApi, type ClinicalSession, type Patient } from './doctorApi'
import { encryption } from './encryption'

export interface SyncItem<T> {
  data: T
  syncStatus: 'synced' | 'pending' | 'failed'
  lastUpdated: string
}

const KEYS = {
  CHATS: 'v_edu_chats',
  PATIENTS: 'v_edu_patients',
  WORKSHEETS: 'v_edu_worksheets',
  VACATIONS: 'v_edu_vacations',
  SURVEYS: 'v_edu_surveys',
  BLOG_POSTS: 'v_edu_blog_posts',
}

class StorageService {
  private _isOnline = ref(navigator.onLine)
  private _pendingCount = ref(0)
  private _isSyncing = ref(false)

  public isOnline = computed(() => this._isOnline.value)
  public pendingCount = computed(() => this._pendingCount.value)
  public isSyncing = computed(() => this._isSyncing.value)

  constructor() {
    this.init()
  }

  private async init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._isOnline.value = true
        this.syncAll()
      })
      window.addEventListener('offline', () => {
        this._isOnline.value = false
      })
    }
    await this.updatePendingCount()
    if (this._isOnline.value) {
      this.syncAll()
    }
  }

  async updatePendingCount() {
    let count = 0
    for (const key of Object.values(KEYS)) {
      const items = await this.getLocal(key)
      count += items.filter(item => item.syncStatus !== 'synced').length
    }
    this._pendingCount.value = count
  }

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    const patient: Patient = {
      patient_id: patientData.patient_id || `PAT-${crypto.randomUUID().substring(0, 8)}`,
      name: patientData.name || 'Neznámý pacient',
      age: patientData.age,
      gender: patientData.gender,
      email: patientData.email,
      phone: patientData.phone,
      notes: patientData.notes,
      doctor_id: patientData.doctor_id || 'DOC-default',
      clinic_id: patientData.clinic_id || 'CLI-default',
      created_at: new Date().toISOString(),
    }
    await this.savePatient(patient)
    return patient
  }

  async createSession(sessionData: {
    patient_id: string
    transcript?: string
    analysis?: any
    status?: 'pending' | 'completed' | 'active'
  }): Promise<ClinicalSession> {
    const sessionId = `SES-${crypto.randomUUID().substring(0, 8)}`
    const now = new Date().toISOString()

    const analysis = sessionData.analysis || {}
    if (!analysis.messages) analysis.messages = []
    if (!analysis.lastActivity) analysis.lastActivity = now

    const session: ClinicalSession = {
      session_id: sessionId,
      patient_id: sessionData.patient_id,
      doctor_id: 'DOC-default',
      clinic_id: 'CLI-default',
      transcript: sessionData.transcript || '',
      status: sessionData.status || 'active',
      created_at: now,
      ai_analysis: analysis,
    }

    await this.saveSession(session)
    return session
  }

  async getSessions(): Promise<ClinicalSession[]> {
    try {
      const remote = await doctorApi.getSessions()
      const local = await this.getLocal<ClinicalSession>(KEYS.CHATS)
      const merged = this.mergeCollections(local, remote, 'session_id')
      await this.saveLocal(KEYS.CHATS, merged)
      return merged.map((item) => item.data)
    } catch {
      const local = await this.getLocal<ClinicalSession>(KEYS.CHATS)
      return local.map((item) => item.data)
    }
  }

  async saveSession(session: ClinicalSession): Promise<void> {
    const session_id = session.session_id
    const local = await this.getLocal<ClinicalSession>(KEYS.CHATS)
    const index = local.findIndex((item) => item.data.session_id === session_id)

    const newItem: SyncItem<ClinicalSession> = {
      data: session,
      syncStatus: 'pending',
      lastUpdated: new Date().toISOString(),
    }

    if (index >= 0) local[index] = newItem
    else local.push(newItem)

    await this.saveLocal(KEYS.CHATS, local)
    await this.updatePendingCount()

    if (this._isOnline.value) {
      try {
        const saved = await doctorApi.saveSession(session)
        const updatedLocal = await this.getLocal<ClinicalSession>(KEYS.CHATS)
        const item = updatedLocal.find((item) => item.data.session_id === session_id)
        if (item) {
          item.data = { ...item.data, ...saved }
          item.syncStatus = 'synced'
          await this.saveLocal(KEYS.CHATS, updatedLocal)
        }
      } catch {
        // Deferred
      }
    }
    await this.updatePendingCount()
  }

  async deleteSession(sessionId: string): Promise<void> {
    const local = await this.getLocal<ClinicalSession>(KEYS.CHATS)
    const updated = local.filter((item) => item.data.session_id !== sessionId)
    await this.saveLocal(KEYS.CHATS, updated)
    await this.updatePendingCount()
    
    if (this._isOnline.value) {
      try {
        await doctorApi.deleteSession(sessionId)
      } catch {
        // Delete deferred
      }
    }
  }

  async getPatients(): Promise<Patient[]> {
    try {
      const remote = await doctorApi.getPatients()
      const local = await this.getLocal<Patient>(KEYS.PATIENTS)
      const merged = this.mergeCollections(local, remote, 'patient_id')
      await this.saveLocal(KEYS.PATIENTS, merged)
      return merged.map((item) => item.data)
    } catch {
      const local = await this.getLocal<Patient>(KEYS.PATIENTS)
      return local.map((item) => item.data)
    }
  }

  async savePatient(patient: Patient): Promise<void> {
    const patient_id = patient.patient_id
    const local = await this.getLocal<Patient>(KEYS.PATIENTS)
    const index = local.findIndex((item) => item.data.patient_id === patient_id)

    const newItem: SyncItem<Patient> = {
      data: patient,
      syncStatus: 'pending',
      lastUpdated: new Date().toISOString(),
    }

    if (index >= 0) local[index] = newItem
    else local.push(newItem)

    await this.saveLocal(KEYS.PATIENTS, local)
    await this.updatePendingCount()

    if (this._isOnline.value) {
      try {
        const saved = await doctorApi.savePatient(patient)
        const updatedLocal = await this.getLocal<Patient>(KEYS.PATIENTS)
        const item = updatedLocal.find((item) => item.data.patient_id === patient_id)
        if (item) {
          item.data = { ...item.data, ...saved }
          item.syncStatus = 'synced'
          await this.saveLocal(KEYS.PATIENTS, updatedLocal)
        }
      } catch {
        // Deferred
      }
    }
    await this.updatePendingCount()
  }

  async deletePatient(patientId: string): Promise<void> {
    const local = await this.getLocal<Patient>(KEYS.PATIENTS)
    const updated = local.filter((item) => item.data.patient_id !== patientId)
    await this.saveLocal(KEYS.PATIENTS, updated)
    await this.updatePendingCount()
    
    if (this._isOnline.value) {
      try {
        await doctorApi.deletePatient(patientId)
      } catch {
        // Delete deferred
      }
    }
  }

  async getWorksheets(patientId?: string): Promise<any[]> {
    try {
      const remote = await doctorApi.getWorksheets(patientId)
      const local = await this.getLocal<any>(KEYS.WORKSHEETS)
      const merged = this.mergeCollections(local, remote, 'id')
      await this.saveLocal(KEYS.WORKSHEETS, merged)
      if (patientId) return merged.filter((item) => item.data.patient_id === patientId).map((item) => item.data)
      return merged.map((item) => item.data)
    } catch {
      const local = await this.getLocal<any>(KEYS.WORKSHEETS)
      if (patientId) return local.filter((item) => item.data.patient_id === patientId).map((item) => item.data)
      return local.map((item) => item.data)
    }
  }

  async createWorksheet(data: { patient_id: string; session_id: string; content: any }): Promise<void> {
    const id = `WS-${Math.random().toString(36).substring(2, 9)}`
    const worksheet = { id, ...data, created_at: new Date().toISOString() }
    const local = await this.getLocal<any>(KEYS.WORKSHEETS)
    local.push({ data: worksheet, syncStatus: 'pending', lastUpdated: new Date().toISOString() })
    await this.saveLocal(KEYS.WORKSHEETS, local)
    await this.updatePendingCount()
    
    if (this._isOnline.value) {
      try {
        const saved = await doctorApi.createWorksheet(data)
        const updatedLocal = await this.getLocal<any>(KEYS.WORKSHEETS)
        const item = updatedLocal.find((item) => item.data.id === id)
        if (item) {
          item.data = { ...item.data, ...saved }
          item.syncStatus = 'synced'
          await this.saveLocal(KEYS.WORKSHEETS, updatedLocal)
        }
      } catch {
        // Deferred
      }
    }
    await this.updatePendingCount()
  }

  async deleteWorksheet(id: string): Promise<void> {
    const local = await this.getLocal<any>(KEYS.WORKSHEETS)
    const updated = local.filter((item) => item.data.id !== id)
    await this.saveLocal(KEYS.WORKSHEETS, updated)
    await this.updatePendingCount()
    
    if (this._isOnline.value) {
      try {
        await doctorApi.deleteWorksheet(id)
      } catch {
        // Delete deferred
      }
    }
  }

  async getSurveys(): Promise<any[]> {
    try {
      const remote = await doctorApi.getSurveys()
      const local = await this.getLocal<any>(KEYS.SURVEYS)
      // Surveys are mostly append-only for local, but we merge to get all
      const merged = this.mergeCollections(local, remote, 'id')
      await this.saveLocal(KEYS.SURVEYS, merged)
      return merged.map((item) => item.data)
    } catch {
      const local = await this.getLocal<any>(KEYS.SURVEYS)
      return local.map((item) => item.data)
    }
  }

  async saveSurvey(survey: any): Promise<void> {
    const local = await this.getLocal<any>(KEYS.SURVEYS)
    const id = survey.id || `SUR-${Date.now()}`
    local.push({ data: { ...survey, id }, syncStatus: 'pending', lastUpdated: new Date().toISOString() })
    await this.saveLocal(KEYS.SURVEYS, local)
    await this.updatePendingCount()
    
    if (this._isOnline.value) {
      try {
        await doctorApi.saveSurvey(survey)
        const updated = await this.getLocal<any>(KEYS.SURVEYS)
        const item = updated.find((i) => i.data.id === id)
        if (item) item.syncStatus = 'synced'
        await this.saveLocal(KEYS.SURVEYS, updated)
      } catch { /* deferred */ }
    }
    await this.updatePendingCount()
  }

  async checkDbConnection(): Promise<boolean> {
    if (!navigator.onLine) return false
    try {
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), 3000)
      const res = await fetch('/api/patients', { 
        method: 'GET', 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      })
      clearTimeout(id)
      const isUp = res.status < 500
      this._isOnline.value = isUp
      return isUp
    } catch {
      this._isOnline.value = false
      return false
    }
  }

  async getVacations(): Promise<any[]> {
    try {
      return await doctorApi.getVacations()
    } catch {
      const local = await this.getLocal<any>(KEYS.VACATIONS)
      return local.map((item) => item.data)
    }
  }

  async addVacation(vacation: any): Promise<any> {
    const local = await this.getLocal<any>(KEYS.VACATIONS)
    const tempId = Date.now()
    const newItem: SyncItem<any> = {
      data: { ...vacation, id: tempId, isTemp: true },
      syncStatus: 'pending',
      lastUpdated: new Date().toISOString(),
    }
    local.push(newItem)
    await this.saveLocal(KEYS.VACATIONS, local)
    await this.updatePendingCount()
    try {
      const result = await doctorApi.addVacation(vacation)
      const updatedLocal = await this.getLocal<any>(KEYS.VACATIONS)
      const item = updatedLocal.find((item) => item.data.id === tempId)
      if (item) {
        item.data = result
        item.syncStatus = 'synced'
        await this.saveLocal(KEYS.VACATIONS, updatedLocal)
      }
      return result
    } catch {
      return newItem.data
    }
  }

  async getBlogPosts(): Promise<any[]> {
    try {
      return await doctorApi.getBlogPosts()
    } catch {
      const local = await this.getLocal<any>(KEYS.BLOG_POSTS)
      return local.map((item) => item.data)
    }
  }

  async saveBlogPost(post: any): Promise<void> {
    const local = await this.getLocal<any>(KEYS.BLOG_POSTS)
    local.push({ data: post, syncStatus: 'pending', lastUpdated: new Date().toISOString() })
    await this.saveLocal(KEYS.BLOG_POSTS, local)
    await this.updatePendingCount()
    try {
      await doctorApi.publishBlogPost(post)
      const updated = await this.getLocal<any>(KEYS.BLOG_POSTS)
      const item = updated.find((i) => i.data.id === post.id)
      if (item) item.syncStatus = 'synced'
      await this.saveLocal(KEYS.BLOG_POSTS, updated)
    } catch { /* deferred */ }
  }

  async syncAll(): Promise<void> {
    if (this._isSyncing.value || !this._isOnline.value) return
    this._isSyncing.value = true
    try {
      await Promise.all([
        this.syncCollection<ClinicalSession>(KEYS.CHATS, (data) => doctorApi.saveSession(data)),
        this.syncCollection<Patient>(KEYS.PATIENTS, (data) => doctorApi.savePatient(data)),
        this.syncCollection<any>(KEYS.WORKSHEETS, (data) => doctorApi.createWorksheet(data)),
        this.syncCollection<any>(KEYS.SURVEYS, (data) => doctorApi.saveSurvey(data)),
        this.syncCollection<any>(KEYS.VACATIONS, (data) => doctorApi.addVacation(data)),
        this.syncCollection<any>(KEYS.BLOG_POSTS, (data) => doctorApi.publishBlogPost(data)),
      ])
    } finally {
      this._isSyncing.value = false
      await this.updatePendingCount()
    }
  }

  private async syncCollection<T>(key: string, syncFn: (data: T) => Promise<any>): Promise<void> {
    const local = await this.getLocal<T>(key)
    const pending = local.filter((item) => item.syncStatus !== 'synced')
    if (pending.length === 0) return

    for (const item of pending) {
      try {
        const result = await syncFn(item.data)
        if (result && typeof result === 'object') {
          item.data = { ...item.data, ...result }
          if ((item.data as any).isTemp) delete (item.data as any).isTemp
        }
        item.syncStatus = 'synced'
      } catch {
        item.syncStatus = 'failed'
      }
    }
    await this.saveLocal(key, local)
  }

  private mergeCollections<T>(local: SyncItem<T>[], remote: T[], idKey: string): SyncItem<T>[] {
    const now = new Date().toISOString()
    const mergedMap = new Map<string, SyncItem<T>>()
    
    // Add remote items
    remote.forEach((remoteItem) => {
      const id = String((remoteItem as any)[idKey])
      mergedMap.set(id, { data: remoteItem, syncStatus: 'synced', lastUpdated: now })
    })

    // Overlay local pending items (they take precedence)
    local.forEach((localItem) => {
      const id = String((localItem.data as any)[idKey])
      if (localItem.syncStatus === 'pending') {
        mergedMap.set(id, localItem)
      }
    })

    return Array.from(mergedMap.values())
  }

  private async getLocal<T>(key: string): Promise<SyncItem<T>[]> {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return []
      const decrypted = await encryption.decrypt(encrypted)
      return Array.isArray(decrypted) ? decrypted : []
    } catch {
      return []
    }
  }

  private async saveLocal<T>(key: string, items: SyncItem<T>[]): Promise<void> {
    try {
      const encrypted = await encryption.encrypt(items)
      localStorage.setItem(key, encrypted)
    } catch (e) {
      console.error(`Failed to save local key ${key}:`, e)
    }
  }
}

export const storageService = new StorageService()
