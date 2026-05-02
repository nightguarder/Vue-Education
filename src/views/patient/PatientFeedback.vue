<template>
  <div class="container-fluid py-4">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom py-3">
            <h4 class="card-title mb-0">Zpětná vazba k sezení</h4>
            <p class="card-text text-muted mb-0 small">
              Vaše zpětná vazba pomáhá zlepšit kvalitu naší péče.
            </p>
          </div>
          <div class="card-body py-4">
            <div v-if="submitted" class="text-center py-5">
              <div class="success-icon mb-4 text-success">
                <i class="bi bi-check-circle-fill display-1"></i>
              </div>
              <h3>Děkujeme!</h3>
              <p class="text-muted">Vaše zpětná vazba byla úspěšně odeslána.</p>
              <router-link to="/patients/home" class="btn btn-primary rounded-pill px-4 mt-3">
                Zpět na hlavní stranu
              </router-link>
            </div>

            <form v-else @submit.prevent="submitFeedback">
              <div class="mb-4">
                <label class="form-label fw-bold">Jak byste ohodnotili dnešní sezení?</label>
                <div class="d-flex justify-content-between mt-2">
                  <div v-for="n in 5" :key="n" class="rating-item">
                    <input 
                      type="radio" 
                      :id="'rating' + n" 
                      name="rating" 
                      v-model="feedback.rating" 
                      :value="n" 
                      class="btn-check"
                    >
                    <label 
                      :for="'rating' + n" 
                      class="btn btn-outline-light border rounded-circle d-flex align-items-center justify-content-center"
                      style="width: 45px; height: 45px;"
                    >
                      {{ n }}
                    </label>
                  </div>
                </div>
                <div class="d-flex justify-content-between small text-muted mt-2">
                  <span>Vůbec nepomohlo</span>
                  <span>Velmi pomohlo</span>
                </div>
              </div>

              <div class="mb-4">
                <label for="feedbackText" class="form-label fw-bold">Chcete nám k dnešku něco sdělit?</label>
                <textarea 
                  id="feedbackText" 
                  v-model="feedback.comment" 
                  class="form-control rounded-3" 
                  rows="4" 
                  placeholder="Vaše postřehy, pocity nebo připomínky..."
                ></textarea>
              </div>

              <div class="d-grid">
                <button 
                  type="submit" 
                  class="btn btn-primary py-2 rounded-pill fw-bold shadow-sm"
                  :disabled="loading || !feedback.rating"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Odeslat zpětnou vazbu
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
import { ref, reactive } from 'vue'
import { patientApi } from '@/services/patientApi'

const loading = ref(false)
const submitted = ref(false)
const feedback = reactive({
  rating: null,
  comment: ''
})

async function submitFeedback() {
  if (!feedback.rating) return
  
  try {
    loading.value = true
    await patientApi.submitFeedback({ ...feedback })
    submitted.value = true
  } catch (e) {
    alert('Odeslání selhalo, zkuste to prosím později.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.rating-item {
  label {
    color: #6c757d;
    font-weight: 600;
    &:hover {
      background-color: #f8f9fa;
    }
  }
}

.btn-check:checked + label {
  background-color: $primary-color !important;
  border-color: $primary-color !important;
  color: white !important;
}

.btn-primary {
  background-color: $primary-color;
  border-color: $primary-color;
  &:hover {
    background-color: darken($primary-color, 10%);
    border-color: darken($primary-color, 10%);
  }
}
</style>
