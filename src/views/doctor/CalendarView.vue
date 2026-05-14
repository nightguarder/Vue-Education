<template>
  <div class="calendar-view">
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col">
          <h2 class="fw-bold">Kalendář a dovolená</h2>
          <p class="text-muted">Správa termínů a čerpání dovolené</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Calendar Section -->
        <div class="col-lg-8">
          <div class="card border-0 rounded-4 shadow-sm">
            <div class="card-header bg-white py-3">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="fw-bold mb-0">{{ currentMonthName }} {{ currentYear }}</h5>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="prevMonth">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="nextMonth">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="card-body p-3">
              <div class="calendar-grid">
                <div class="calendar-header mb-2">
                  <div v-for="day in weekDays" :key="day" class="calendar-day-header text-center">
                    {{ day }}
                  </div>
                </div>
                <div class="calendar-body">
                  <div
                    v-for="(day, index) in calendarDays"
                    :key="index"
                    class="calendar-day text-center"
                    :class="{
                      'other-month': !day.isCurrentMonth,
                      'today': day.isToday,
                      'vacation': day.isVacation,
                      'weekend': day.isWeekend
                    }"
                  >
                    <span class="day-number">{{ day.date }}</span>
                    <div v-if="day.isVacation" class="vacation-indicator">
                      <i class="bi bi-sun"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vacation Management Section -->
        <div class="col-lg-4">
          <div class="card border-0 rounded-4 shadow-sm mb-4">
            <div class="card-header bg-white py-3">
              <h5 class="fw-bold mb-0">Plán dovolené</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Celkem dní</span>
                  <span class="fw-bold">{{ totalVacationDays }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span class="text-muted">Čerpáno</span>
                  <span class="fw-bold text-warning">{{ usedVacationDays }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Zbývá</span>
                  <span class="fw-bold text-success">{{ remainingVacationDays }}</span>
                </div>
              </div>
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar bg-warning"
                  :style="{ width: vacationProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="card border-0 rounded-4 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">Přidat dovolenou</h5>
              <button class="btn btn-sm btn-primary" @click="showAddModal = true">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div class="card-body p-0">
              <div v-if="vacations.length === 0" class="text-center text-muted p-4">
                <i class="bi bi-calendar-x fs-3 mb-2 d-block opacity-50"></i>
                <small>Žádné naplánované dovolené</small>
              </div>
              <div v-else class="list-group list-group-flush">
                <div
                  v-for="vacation in vacations"
                  :key="vacation.id"
                  class="list-group-item border-0 py-3"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-bold">{{ formatVacationDates(vacation) }}</div>
                      <small class="text-muted">{{ vacation.days }} dní</small>
                    </div>
                    <button
                      class="btn btn-sm btn-link text-danger p-0"
                      @click="removeVacation(vacation.id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Vacation Modal -->
    <div v-if="showAddModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Přidat dovolenou</h5>
            <button type="button" class="btn-close" @click="showAddModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Od</label>
              <input v-model="newVacation.start" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Do</label>
              <input v-model="newVacation.end" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Důvod</label>
              <select v-model="newVacation.reason" class="form-select">
                <option value="vacation">Dovolená</option>
                <option value="sick">Nemoc</option>
                <option value="personal">Osobní</option>
                <option value="other">Jiné</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false">
              Zrušit
            </button>
            <button type="button" class="btn btn-primary" @click="addVacation">Přidat</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storageService } from '@/services/storageService'
import { doctorApi } from '@/services/doctorApi'

interface Vacation {
  id: number
  start_date: string
  end_date: string
  reason: string
  days: number
}

const weekDays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const currentDate = ref(new Date())
const showAddModal = ref(false)
const isLoading = ref(false)

const newVacation = ref({
  start: '',
  end: '',
  reason: 'vacation'
})

const totalVacationDays = ref(25)
const usedVacationDays = ref(0)
const vacations = ref<Vacation[]>([])

onMounted(async () => {
  await loadVacationData()
})

async function loadVacationData() {
  isLoading.value = true
  try {
    // 1. Try to get settings (with fallback)
    try {
      const settings = await doctorApi.getVacationSettings()
      if (settings) totalVacationDays.value = settings.total_days || 25
    } catch (err) {
      console.warn('Could not fetch remote vacation settings, using defaults.')
    }

    // 2. Load vacations (storageService handles the fallback internally)
    const data = await storageService.getVacations()
    vacations.value = data.map((v: any) => ({
      id: v.id,
      start_date: v.start_date,
      end_date: v.end_date,
      reason: v.reason,
      days: v.days || 1 // Fallback if days not calculated
    }))
    usedVacationDays.value = vacations.value.reduce((sum, v) => sum + (v.days || 0), 0)
  } catch (e) {
    console.error('Failed to load vacation data:', e)
  } finally {
    isLoading.value = false
  }
}

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => {
  const months = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ]
  return months[currentMonth.value]
})

const remainingVacationDays = computed(() => totalVacationDays.value - usedVacationDays.value)
const vacationProgress = computed(() => (usedVacationDays.value / totalVacationDays.value) * 100)

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = (firstDay.getDay() + 6) % 7
  
  const days = []
  
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isVacation: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    const isVacation = vacations.value.some(v => {
      const start = new Date(v.start_date)
      const end = new Date(v.end_date)
      return date >= start && date <= end
    })
    
    const today = new Date()
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear()
    
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday,
      isVacation,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      isVacation: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  
  return days
})

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function formatVacationDates(vacation: Vacation): string {
  const start = new Date(vacation.start_date)
  const end = new Date(vacation.end_date)
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString('cs-CZ', options)} - ${end.toLocaleDateString('cs-CZ', options)}`
}

async function addVacation() {
  if (!newVacation.value.start || !newVacation.value.end) return
  
  const start = new Date(newVacation.value.start)
  const end = new Date(newVacation.value.end)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  try {
    const result = await storageService.addVacation({
      doctor_id: 'DOC-default',
      start_date: newVacation.value.start,
      end_date: newVacation.value.end,
      reason: newVacation.value.reason as 'vacation' | 'sick' | 'personal' | 'other'
    })
    
    vacations.value.push({
      id: result.id,
      start_date: newVacation.value.start,
      end_date: newVacation.value.end,
      reason: newVacation.value.reason,
      days
    })
    usedVacationDays.value += days
  } catch (e) {
    console.error('Failed to add vacation:', e)
  }
  
  newVacation.value = { start: '', end: '', reason: 'vacation' }
  showAddModal.value = false
}

async function removeVacation(id: number) {
  const vacation = vacations.value.find(v => v.id === id)
  if (!vacation) return
  
  try {
    await doctorApi.deleteVacation(id)
  } catch (e) {
    console.error('Failed to delete vacation:', e)
  }
  
  usedVacationDays.value -= vacation.days
  vacations.value = vacations.value.filter(v => v.id !== id)
}
</script>

<style scoped lang="scss">
.calendar-view {
  background-color: #fcfcfc;
  min-height: calc(100vh - 80px);
}

.calendar-grid {
  user-select: none;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  padding: 0.5rem;
  text-transform: uppercase;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: #f8f9fa;
  }

  &.other-month {
    opacity: 0.4;
  }

  &.today {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    
    .day-number {
      background-color: var(--bs-primary);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &.vacation {
    background-color: rgba(255, 193, 7, 0.15);
  }

  &.weekend {
    .day-number {
      color: #dc3545;
    }
  }
}

.day-number {
  font-size: 0.9rem;
  font-weight: 500;
}

.vacation-indicator {
  position: absolute;
  bottom: 2px;
  font-size: 0.7rem;
  color: #ffc107;
}

.text-primary {
  color: $primary-color !important;
}
.text-success {
  color: #38a169 !important;
}
.text-warning {
  color: #d69e2e !important;
}
.text-danger {
  color: #e53e3e !important;
}
</style>