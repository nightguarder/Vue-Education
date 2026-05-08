<template>
  <div class="container-fluid py-3 px-3">
    <!-- Breadcrumb / Back Navigation -->
    <div class="row mb-3">
      <div class="col-12">
        <router-link
          to="/patients/home"
          class="text-decoration-none text-muted d-flex align-items-center"
        >
          <i class="bi bi-arrow-left me-2"></i> Zpět na přehled
        </router-link>
      </div>
    </div>

    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom">
            <h4 class="card-title mb-1">Vaše pracovní listy</h4>
            <p class="card-text text-muted mb-0 small">
              Vytiskněte si svá domácí cvičení a pracovní listy přidělené vaším terapeutem.
            </p>
          </div>
          <div class="card-body">
            <!-- Patient ID Input -->
            <div class="mb-4">
              <div class="mb-2">
                <label for="patient-id" class="form-label">ID pacienta (nepovinné)</label>
                <div class="d-flex gap-2">
                  <input
                    id="patient-id"
                    v-model="patientId"
                    class="form-control"
                    placeholder="Zadejte své ID pacienta nebo ponechte prázdné pro režim hosta"
                    :disabled="loading"
                  />
                  <button class="btn btn-primary" @click="loadWorksheets" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                    {{ loading ? 'Načítání...' : 'Načíst' }}
                  </button>
                  <button v-if="patientId" class="btn btn-outline-secondary" @click="clearId">
                    Vymazat
                  </button>
                </div>
              </div>
              <div v-if="isGuestMode" class="text-muted small">
                <i class="bi bi-info-circle me-1"></i>
                Režim hosta: Zobrazují se obecné pracovní listy. Zadejte své ID pro personalizované
                pracovní listy.
              </div>
              <div v-else class="text-success small">
                <i class="bi bi-check-circle me-1"></i>
                Načteny pracovní listy pro pacienta: {{ patientId }}
              </div>
            </div>

            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Načítání...</span>
              </div>
              <p class="mt-3">Načítání pracovních listů...</p>
            </div>

            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ error }}
            </div>

            <div v-else-if="worksheets.length === 0" class="text-center py-5">
              <i class="bi bi-journal-text display-4 text-muted mb-4"></i>
              <h5>Nenalezeny žádné pracovní listy</h5>
              <p class="text-muted">
                {{
                  isGuestMode
                    ? 'Nejsou k dispozici žádné obecné pracovní listy. Zkontrolujte prosím později.'
                    : 'Požádejte svého terapeuta o přidělení pracovních listů prostřednictvím lékařského portálu.'
                }}
              </p>
            </div>

            <div v-else class="row g-4">
              <div v-for="worksheet in worksheets" :key="worksheet.id" class="col-md-6">
                <div class="card h-100 shadow-sm border-0">
                  <div class="card-body d-flex flex-column">
                    <div class="flex-grow-1">
                      <h5 class="card-title">{{ worksheet.title }}</h5>
                      <p class="card-text text-muted small">
                        {{
                          worksheet.assignedAt
                            ? new Date(worksheet.assignedAt).toLocaleDateString()
                            : ''
                        }}
                      </p>

                      <div v-if="worksheet.instruction" class="alert alert-info mt-3 small">
                        <i class="bi bi-lightbulb me-2"></i>
                        {{ worksheet.instruction }}
                      </div>
                    </div>

                    <div class="d-grid gap-2 mt-3">
                      <button
                        v-if="worksheet.fields"
                        @click="startInteractive(worksheet)"
                        class="btn btn-primary btn-sm"
                      >
                        <i class="bi bi-pencil-square me-1"></i>
                        {{ worksheet.completed ? 'Zobrazit odpověď' : 'Vyplnit online' }}
                      </button>

                      <button
                        v-if="worksheet.fields"
                        @click="printWorksheet(worksheet)"
                        class="btn btn-outline-secondary btn-sm"
                      >
                        <i class="bi bi-printer me-1"></i> Tisk
                      </button>

                      <button
                        v-if="worksheet.pdfUrl"
                        @click="viewPdf(worksheet)"
                        class="btn btn-outline-primary btn-sm"
                      >
                        <i class="bi bi-eye me-1"></i> Zobrazit PDF
                      </button>

                      <button
                        v-if="worksheet.pdfUrl"
                        @click="printWorksheet(worksheet)"
                        class="btn btn-outline-success btn-sm"
                      >
                        <i class="bi bi-printer me-1"></i> Tisk PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Worksheet Form Modal -->
    <div
      v-if="activeWorksheet"
      class="modal fade show"
      style="display: block; background: rgba(0, 0, 0, 0.5)"
      @click.self="activeWorksheet = null"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">{{ activeWorksheet.title }}</h5>
            <button type="button" class="btn-close" @click="activeWorksheet = null"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitWorksheet">
              <div v-for="field in activeWorksheet.fields" :key="field.id" class="mb-3">
                <template v-if="(field.type as any) === 'header'">
                  <div class="mt-4 mb-2 border-bottom pb-1">
                    <h6 class="fw-bold text-primary mb-0">{{ field.label }}</h6>
                  </div>
                </template>

                <template v-else>
                  <label :for="field.id" class="form-label">{{ field.label }}</label>
                  
                  <template v-if="field.type === 'textarea'">
                    <textarea
                      :id="field.id"
                      v-model="responses[field.id]"
                      class="form-control"
                      :placeholder="field.placeholder"
                      rows="3"
                    ></textarea>
                  </template>

                  <template v-else-if="field.type === 'slider'">
                    <input
                      :id="field.id"
                      v-model.number="responses[field.id]"
                      type="range"
                      :min="field.min"
                      :max="field.max"
                      class="form-range"
                    />
                    <div class="text-muted small mt-1">
                      Hodnota: {{ responses[field.id] || field.value || 0 }}
                    </div>
                  </template>

                  <template v-else-if="field.type === 'checkbox'">
                    <div class="form-check">
                      <input
                        :id="field.id"
                        v-model="responses[field.id]"
                        type="checkbox"
                        class="form-check-input"
                      />
                      <label :for="field.id" class="form-check-label">
                        {{ field.label }}
                      </label>
                    </div>
                  </template>
                </template>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="activeWorksheet = null"
                >
                  Zrušit
                </button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check-lg me-1"></i> Odeslat
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { patientApi, type Worksheet } from '@/services/patientApi'

const route = useRoute()
const patientId = ref<string>('')
const isGuestMode = ref(true)
const activeWorksheet = ref<Worksheet | null>(null)
const responses = ref<Record<string, any>>({})

// Worksheets state
const worksheets = ref<Worksheet[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(() => {
  // Check URL query for patient ID
  patientId.value = (route.query.patientId as string) || (route.query.id as string) || ''
  loadWorksheets()
})

async function loadWorksheets() {
  loading.value = true
  error.value = null

  try {
    if (!patientId.value.trim()) {
      // Guest mode - fetch templates
      isGuestMode.value = true
      const templatesRes = await fetch('/api/templates?public=1')
      const templates = await templatesRes.json()
      
      worksheets.value = templates.map((t: any) => ({
        id: t.template_id,
        title: t.title,
        type: t.type,
        fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields,
        status: 'available' as const,
        assignedAt: new Date().toISOString(),
      }))
      return
    }

    isGuestMode.value = false
    const data = await patientApi.getPatientData(patientId.value)
    
    worksheets.value = data.worksheets.map((pw: any) => {
      // If it's a dynamic worksheet, use custom_questions as fields
      const fields = pw.template_id === 'dynamic' 
        ? (typeof pw.custom_questions === 'string' ? JSON.parse(pw.custom_questions) : pw.custom_questions)
        : (typeof pw.fields === 'string' ? JSON.parse(pw.fields) : pw.fields)

      // If custom_questions is a full worksheet object (title, intro, fields)
      const isFullCustom = fields && fields.fields && fields.title
      
      return {
        id: pw.id, // Database primary key
        template_id: pw.template_id,
        title: isFullCustom ? fields.title : (pw.title || 'Personalizovaný pracovní list'),
        type: pw.type || 'dynamic',
        intro: isFullCustom ? fields.intro : (pw.intro || ''),
        fields: isFullCustom ? fields.fields : fields,
        status: pw.status,
        assignedAt: pw.assigned_at,
        completed: pw.status === 'completed'
      }
    })

  } catch (err: any) {
    console.error('[PatientWorksheets] Load error:', err)
    error.value = `Nepodařilo se načíst pracovní listy: ${err.message}`
    worksheets.value = []
  } finally {
    loading.value = false
  }
}

function startInteractive(worksheet: Worksheet) {
  activeWorksheet.value = worksheet
  responses.value = {}
}

function viewPdf(worksheet: Worksheet) {
  if (worksheet.pdfUrl) {
    window.open(worksheet.pdfUrl, '_blank')
  }
}

function printWorksheet(worksheet: Worksheet) {
  if (!worksheet.fields) {
    // If no interactive fields, try PDF
    if (worksheet.pdfUrl) {
      window.open(worksheet.pdfUrl, '_blank')
      setTimeout(() => window.print(), 500)
    }
    return
  }

  // Print the interactive form
  const printContent = document.createElement('div')
  printContent.innerHTML = `
    <h2>${worksheet.title}</h2>
    ${worksheet.fields
        .map(
          (f) => `
      <div style="margin-bottom: 16px;">
        <strong>${f.label}</strong><br/>
        <div style="border-bottom: 1px solid #ccc; min-height: 24px; margin-top: 4px;">
          ${responses.value[f.id] || ''}
        </div>
      </div>
    `,
        )
        .join('')}
    <div style="margin-top: 24px; font-size: 12px; color: #666;">
      Vytištěno z Vzdělávací platformy - ${new Date().toLocaleDateString()}
    </div>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${worksheet.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
}

async function submitWorksheet() {
  if (!activeWorksheet.value) return

  const worksheet = activeWorksheet.value
  const responseData = { ...responses.value }

  try {
    loading.value = true
    await patientApi.submitWorksheet({
      patient_id: patientId.value,
      worksheet_id: worksheet.id as number,
      responses: responseData
    })
    
    alert('Pracovní list byl úspěšně odeslán!')
    activeWorksheet.value = null
    await loadWorksheets() // Reload to show completed status
  } catch (e: any) {
    alert('Chyba při odesílání: ' + e.message)
  } finally {
    loading.value = false
  }
}

function clearId() {
  patientId.value = ''
  isGuestMode.value = true
  loadWorksheets()
}
</script>

<style scoped>
.modal {
  z-index: 1050;
}
.modal-dialog {
  max-width: 600px;
}
.card-title {
  font-size: 1.1rem;
  font-weight: 600;
}
.alert-info {
  border-radius: 8px;
  font-size: 0.85rem;
}
</style>
