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

export const patientApi = {
  /**
   * Fetches patient data (worksheets and audio clips) using a secure token
   */
  getPatientData(token: string): Promise<PatientData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let customWorksheets: Worksheet[] = []

        if (token) {
          const key = `patient_worksheets_${token}`
          const storedStr = localStorage.getItem(key)
          if (storedStr) {
            try {
              customWorksheets.push(...JSON.parse(storedStr))
            } catch (e) {}
          }
        }

        if (customWorksheets.length === 0) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('patient_worksheets_')) {
              try {
                const sheets = JSON.parse(localStorage.getItem(key) || '[]')
                if (Array.isArray(sheets)) {
                  customWorksheets.push(...sheets)
                }
              } catch (e) {}
            }
          }
        }

        const mockData: PatientData = {
          worksheets:
            customWorksheets.length > 0
              ? customWorksheets
              : [
                  {
                    id: 1,
                    title: 'Záznam myšlenek (KBT)',
                    type: 'cbt_record',
                    intro: 'Pojďme se podívat na to, co se stalo během našeho posledního sezení.',
                    fields: [
                      {
                        id: 'q1',
                        type: 'textarea',
                        label: 'Co se přesně stalo? (Spouštěč)',
                        placeholder: 'Popište situaci...',
                      },
                      {
                        id: 'q2',
                        type: 'slider',
                        min: 0,
                        max: 10,
                        label: 'Jak silná byla úzkost? (0-10)',
                        value: 5,
                      },
                      {
                        id: 'q3',
                        type: 'textarea',
                        label: 'Jaká automatická myšlenka vás napadla?',
                        placeholder: 'např. Zase to pokazím...',
                      },
                      {
                        id: 'q4',
                        type: 'textarea',
                        label: 'Jaká alternativní myšlenka by vám pomohla?',
                        placeholder: 'např. Mám dostatek zkušeností...',
                      },
                    ],
                    pdfUrl: '/worksheets/understanding-anxiety.pdf',
                  },
                  {
                    id: 2,
                    title: 'Hierarchie expozice',
                    type: 'exposure',
                    intro: 'Zde je seznam úkolů, na kterých jsme se dohodli.',
                    fields: [
                      { id: 'task1', type: 'checkbox', label: 'Jet tramvají jednu zastávku' },
                      {
                        id: 'task1_anxiety',
                        type: 'slider',
                        min: 0,
                        max: 10,
                        label: 'Úroveň úzkosti u tohoto úkolu',
                        value: 0,
                      },
                      { id: 'task2', type: 'checkbox', label: 'Oslovit cizího člověka na ulici' },
                      {
                        id: 'task2_anxiety',
                        type: 'slider',
                        min: 0,
                        max: 10,
                        label: 'Úroveň úzkosti u tohoto úkolu',
                        value: 0,
                      },
                    ],
                    pdfUrl: '/worksheets/cbt-basics.pdf',
                  },
                ],
        }

        resolve(mockData)
      }, 800)
    })
  },

  /**
   * Submits completed worksheet data
   */
  submitWorksheet(worksheetData: Record<string, unknown>): Promise<WorksheetResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Submitting worksheet:', worksheetData)
        resolve({
          success: true,
          message: 'Pracovní list byl úspěšně odeslán vašemu lékaři.',
          timestamp: new Date().toISOString(),
        })
      }, 800)
    })
  },

  /**
   * Submits feedback data
   */
  submitFeedback(feedbackData: Record<string, unknown>): Promise<WorksheetResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Děkujeme za vaši zpětnou vazbu!',
          timestamp: new Date().toISOString(),
        })
      }, 600)
    })
  },
}
