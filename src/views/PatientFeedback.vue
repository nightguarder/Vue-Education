<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-sm">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <div>
              <h4 class="mb-0">Zpětná vazba na konzultaci</h4>
              <p class="text-muted small mb-0">Pomozte nám zlepšit naše služby</p>
            </div>
            <button
              v-if="!submitted && isDirty"
              class="btn btn-outline-secondary btn-sm"
              @click="exitForm"
            >
              <i class="bi bi-x-lg"></i> Zrušit
            </button>
          </div>
          <div class="card-body">
            <div v-if="submitted" class="text-center py-4">
              <i class="bi bi-check-circle text-success display-4"></i>
              <h5 class="mt-3">Děkujeme!</h5>
              <p class="text-muted">Vaše zpětná vazba byla odeslána.</p>
            </div>

            <form v-else @submit.prevent="submitFeedback">
              <div class="mb-4">
                <label class="form-label fw-bold">1. Jak hodnotíte délku konzultace?</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="duration"
                      id="duration1"
                      value="krátká"
                      v-model="form.duration"
                      required
                    />
                    <label class="form-check-label" for="duration1">Příliš krátká</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="duration"
                      id="duration2"
                      value="optimální"
                      v-model="form.duration"
                    />
                    <label class="form-check-label" for="duration2">Optimální</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="duration"
                      id="duration3"
                      value="dlouhá"
                      v-model="form.duration"
                    />
                    <label class="form-check-label" for="duration3">Příliš dlouhá</label>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-bold"
                  >2. Cítil(a) jste, že lékař věnoval dostatečnou pozornost vašim obavám?</label
                >
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="attention"
                      id="attention1"
                      value="ano"
                      v-model="form.attention"
                      required
                    />
                    <label class="form-check-label" for="attention1">Ano, zcela</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="attention"
                      id="attention2"
                      value="částečně"
                      v-model="form.attention"
                    />
                    <label class="form-check-label" for="attention2">Částečně</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="attention"
                      id="attention3"
                      value="ne"
                      v-model="form.attention"
                    />
                    <label class="form-check-label" for="attention3">Ne, nedostatečně</label>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-bold"
                  >3. Byly vaše dotazy dostatečně zodpovězeny?</label
                >
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="answered"
                      id="answered1"
                      value="ano"
                      v-model="form.answered"
                      required
                    />
                    <label class="form-check-label" for="answered1">Ano, všechny</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="answered"
                      id="answered2"
                      value="většina"
                      v-model="form.answered"
                    />
                    <label class="form-check-label" for="answered2">Většina</label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="answered"
                      id="answered3"
                      value="ne"
                      v-model="form.answered"
                    />
                    <label class="form-check-label" for="answered3">Ne, některé ne</label>
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label fw-bold">4. Máte něco dalšího na srdci?</label>
                <textarea
                  v-model="form.comments"
                  class="form-control"
                  rows="3"
                  placeholder="Jakékoli další připomínky nebo návrhy na zlepšení..."
                ></textarea>
              </div>

              <button type="submit" class="btn btn-primary w-100" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                Odeslat zpětnou vazbu
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'

const route = useRoute()
const router = useRouter()

const form = reactive({
  duration: '',
  attention: '',
  answered: '',
  comments: '',
})

const submitting = ref(false)
const submitted = ref(false)

const isDirty = computed(() => {
  return form.duration !== '' || form.attention !== '' || form.answered !== '' || form.comments !== ''
})

onBeforeRouteLeave((to, from, next) => {
  if (!submitted.value && isDirty.value) {
    if (confirm('Opravdu chcete odejít bez odeslání zpětné vazby?')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

function beforeUnload(e: BeforeUnloadEvent) {
  if (!submitted.value && isDirty.value) {
    e.preventDefault()
    e.returnValue = 'Opravdu chcete odejít bez odeslání zpětné vazby?'
    return e.returnValue
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})

function exitForm() {
  if (isDirty.value) {
    if (confirm('Opravdu chcete odejít bez odeslání zpětné vazby?')) {
      router.push('/')
    }
  } else {
    router.push('/')
  }
}

function submitFeedback() {
  if (!form.duration || !form.attention || !form.answered) return

  submitting.value = true

  // Save to localStorage (in real app, send to server)
  const feedback = {
    sessionToken: route.query.token,
    timestamp: new Date().toISOString(),
    ...form,
  }

  const existing = JSON.parse(localStorage.getItem('patient_feedback') || '[]')
  existing.push(feedback)
  localStorage.setItem('patient_feedback', JSON.stringify(existing))

  setTimeout(() => {
    submitted.value = true
    submitting.value = false
  }, 1000)
}
</script>
