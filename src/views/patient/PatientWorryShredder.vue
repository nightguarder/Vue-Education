<template>
  <div class="container-fluid py-3 px-3">
    <div class="row justify-content-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom py-3">
            <h4 class="card-title mb-1">Emotion Release</h4>
            <p class="card-text text-muted mb-0 small">Write or record your feelings and let them go.</p>
          </div>
          <div class="card-body py-4 px-3 px-md-4 min-vh-50 d-flex flex-column justify-content-center align-items-center">

            <!-- Step 1: Input worry -->
            <div v-if="step === 'input'" class="step-input w-100">
              <div class="mb-4">
                <label for="worryInput" class="form-label fw-medium fs-5">What's troubling you right now?</label>
                <div class="position-relative">
                  <textarea
                    id="worryInput"
                    v-model="worryText"
                    class="form-control rounded-4 shadow-sm"
                    rows="6"
                    placeholder="You can write your feelings here..."
                    maxlength="500"
                    style="resize: none; padding-bottom: 60px;"
                  ></textarea>

                  <div class="position-absolute bottom-0 end-0 p-3 d-flex align-items-center gap-2">
                    <span v-if="speechRecording" class="small text-danger fw-bold pulse-text">RECORDING...</span>
                    <button
                      @click="toggleVoiceRecording"
                      :disabled="isProcessing"
                      class="btn rounded-circle shadow-sm voice-action-btn d-flex align-items-center justify-content-center"
                      :class="speechRecording ? 'btn-danger pulse' : 'btn-light border'"
                      type="button"
                      style="width: 48px; height: 48px;"
                      :title="speechRecording ? 'Stop recording' : 'Record voice'"
                    >
                      <i v-if="speechRecording" class="bi bi-stop-fill fs-4"></i>
                      <i v-else class="bi bi-mic-fill fs-4"></i>
                    </button>
                  </div>
                </div>

                <div class="form-text mt-2 small d-flex justify-content-between text-muted">
                  <span>{{ worryText.length }}/500 characters</span>
                  <span v-if="speechTranscript" class="text-success fw-medium">
                    <i class="bi bi-check2-all me-1"></i> Voice recognized
                  </span>
                </div>
              </div>

              <div class="d-grid gap-2 col-md-8 mx-auto mt-4">
                <button
                  @click="shredWorry"
                  :disabled="!worryText.trim() || isProcessing"
                  class="btn btn-dark py-3 rounded-pill fw-bold fs-5 shadow-sm"
                >
                  <i class="bi bi-emoji-laughing me-2"></i> Release Emotions
                </button>
              </div>
            </div>

            <!-- Step 2: Shredding animation -->
            <div v-else-if="step === 'shredding'" class="step-shredding text-center py-5 w-100">
              <div class="shredder-container mx-auto">
                <div class="shredder-top"></div>
                <div class="paper-container">
                  <div class="paper" :class="{ 'shredding-active': isShredding }">
                    <p class="paper-text text-truncate">{{ worryText }}</p>
                  </div>
                  <div class="shreds-container" :class="{ 'shredding-active': isShredding }">
                    <div v-for="i in 10" :key="i" class="shred" :style="{ left: `${(i-1)*10}%` }"></div>
                  </div>
                </div>
                <div class="shredder-bottom">
                  <div class="shredder-slot"></div>
                </div>
              </div>
              <h5 class="mt-5 text-secondary fw-bold fade-in-out">Releasing...</h5>
            </div>

            <!-- Step 3: Response -->
            <div v-else-if="step === 'ai-response'" class="step-ai-response text-center py-4 w-100 fade-in">
              <div class="mb-4">
                <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                  <i class="bi bi-stars me-1"></i> A thought for you
                </span>
              </div>
              <div class="ai-response-card mx-auto p-4 bg-light rounded-4 shadow-sm mb-4" style="max-width: 500px;">
                <p v-if="worryLoading" class="text-muted mb-0">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Finding the right words...
                </p>
                <p v-else class="fs-5 text-dark mb-0 lh-base fw-medium">
                  {{ aiResponse }}
                </p>
              </div>
              <p class="text-muted small mb-4">AI-generated inspiration.</p>
              <button @click="startBreathing" class="btn btn-outline-primary rounded-pill px-4">
                <i class="bi bi-lungs me-2"></i> Continue to breathing
              </button>
            </div>

            <!-- Step 4: Box Breathing -->
            <div v-else-if="step === 'breathing'" class="step-breathing text-center py-4 w-100">
              <h4 class="mb-4 fw-bold text-dark">Box Breathing</h4>
              <p class="text-muted mb-5">A technique to calm the mind and reduce stress.</p>

              <div class="breathing-container position-relative mx-auto mb-5">
                <div class="breathing-box">
                  <div class="breathing-indicator" :class="breathingPhase"></div>
                </div>
                <div class="breathing-text-center position-absolute top-50 start-50 translate-middle w-100">
                  <h2 class="fw-bold mb-0 text-primary transition-all">{{ breathingPhaseText }}</h2>
                  <div class="timer-text mt-2 fs-4 fw-medium text-secondary">{{ breathingTimeRemaining }}s</div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-4 px-4 text-muted small fw-medium">
                <span>Cycle: {{ breathingCycles + 1 }}/{{ totalCycles }}</span>
                <button @click="finishBreathing" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                  Skip
                </button>
              </div>
            </div>

            <!-- Step 5: Complete -->
            <div v-else-if="step === 'complete'" class="step-complete text-center py-5 w-100 fade-in">
              <div class="success-icon mx-auto mb-4 bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 100px; height: 100px;">
                <i class="bi bi-check2-circle" style="font-size: 3.5rem;"></i>
              </div>
              <h3 class="fw-bold mb-3 text-dark">It's gone</h3>
              <p class="text-muted fs-5 mb-5 px-md-4">
                The worry has been symbolically destroyed. Hope you feel a bit better.
              </p>
              <button @click="reset" class="btn btn-dark btn-lg rounded-pill px-5 shadow-sm w-100 w-sm-auto">
                <i class="bi bi-arrow-clockwise me-2"></i> Again
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useWorryAI } from '../../composables/useWorryAI'

const {
  isLoading: worryLoading,
  isReady,
  loadModel,
  generateResponse,
  generateDailyQuote,
  getRandomQuote
} = useWorryAI()

const step = ref<'input' | 'shredding' | 'ai-response' | 'breathing' | 'complete'>('input')
const worryText = ref('')
const aiResponse = ref('')
const isProcessing = ref(false)
const isShredding = ref(false)
const speechTranscript = ref('')
const speechRecording = ref(false)

// Breathing state
type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out'
const breathingPhase = ref<BreathingPhase>('inhale')
const breathingTimeRemaining = ref(4)
const breathingCycles = ref(0)
const totalCycles = 4
let breathingInterval: ReturnType<typeof setInterval> | null = null

const breathingPhaseText = computed(() => {
  switch (breathingPhase.value) {
    case 'inhale': return 'Inhale'
    case 'hold-in': return 'Hold'
    case 'exhale': return 'Exhale'
    case 'hold-out': return 'Hold'
    default: return ''
  }
})

onMounted(() => {
  const textarea = document.getElementById('worryInput')
  if (textarea) textarea.focus()

  // Load AI model in background
  loadModel().catch(err => {
    console.warn('[WorryShredder] AI model load warning:', err)
  })
})

onUnmounted(() => {
  if (breathingInterval) {
    clearInterval(breathingInterval)
  }
})

async function toggleVoiceRecording() {
  // Mock voice recording toggle - replace with real speech-to-text later
  speechRecording.value = !speechRecording.value
  if (!speechRecording.value && !speechTranscript.value) {
    speechTranscript.value = 'This is a mock voice transcript.'
    worryText.value = speechTranscript.value
  }
}

async function shredWorry() {
  if (!worryText.value.trim()) return

  step.value = 'shredding'
  isProcessing.value = true

  setTimeout(() => {
    isShredding.value = true
  }, 100)

  // Generate AI response based on worry content
  try {
    const response = await generateResponse(worryText.value)
    aiResponse.value = response
  } catch (e) {
    console.error('[WorryShredder] Response generation failed:', e)
    aiResponse.value = getRandomQuote()
  }

  setTimeout(() => {
    step.value = 'ai-response'
  }, 3500)
}

function startBreathing() {
  step.value = 'breathing'
  breathingCycles.value = 0
  breathingPhase.value = 'inhale'
  breathingTimeRemaining.value = 4

  if (breathingInterval) clearInterval(breathingInterval)

  breathingInterval = setInterval(() => {
    breathingTimeRemaining.value--

    if (breathingTimeRemaining.value <= 0) {
      advanceBreathingPhase()
    }
  }, 1000)
}

function advanceBreathingPhase() {
  breathingTimeRemaining.value = 4

  switch (breathingPhase.value) {
    case 'inhale':
      breathingPhase.value = 'hold-in'
      break
    case 'hold-in':
      breathingPhase.value = 'exhale'
      break
    case 'exhale':
      breathingPhase.value = 'hold-out'
      break
    case 'hold-out':
      breathingPhase.value = 'inhale'
      breathingCycles.value++

      if (breathingCycles.value >= totalCycles) {
        finishBreathing()
      }
      break
  }
}

function finishBreathing() {
  if (breathingInterval) {
    clearInterval(breathingInterval)
    breathingInterval = null
  }
  step.value = 'complete'
  isProcessing.value = false
  isShredding.value = false
}

function reset() {
  step.value = 'input'
  worryText.value = ''
  speechTranscript.value = ''
  breathingCycles.value = 0
}
</script>

<style scoped>
.min-vh-50 {
  min-height: 50vh;
}

.transition-all {
  transition: all 0.3s ease;
}

textarea:focus {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.05);
  border-color: #dee2e6;
}

.voice-action-btn {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.voice-action-btn:hover {
  transform: scale(1.1);
}

.voice-action-btn:active {
  transform: scale(0.95);
}

.pulse {
  animation: pulse-animation 1.5s infinite;
}

.pulse-text {
  animation: pulse-text-animation 1.5s infinite;
  letter-spacing: 1px;
}

@keyframes pulse-text-animation {
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
}

@keyframes pulse-animation {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}

/* Shredder Animation */
.shredder-container {
  position: relative;
  width: 200px;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.shredder-top {
  width: 100%;
  height: 60px;
  background-color: #343a40;
  border-radius: 10px 10px 0 0;
  z-index: 3;
  position: relative;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.shredder-bottom {
  width: 110%;
  height: 40px;
  background-color: #212529;
  border-radius: 0 0 10px 10px;
  z-index: 3;
  position: relative;
  margin-top: -10px;
  display: flex;
  justify-content: center;
}

.shredder-slot {
  width: 80%;
  height: 8px;
  background-color: #000;
  border-radius: 5px;
  margin-top: -4px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
}

.paper-container {
  position: absolute;
  top: -100px;
  width: 140px;
  height: 150px;
  z-index: 2;
  overflow: hidden;
  clip-path: inset(-100px -20px 250px -20px);
}

.paper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 3s linear;
}

.paper-text {
  font-size: 10px;
  color: #495057;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

.paper.shredding-active {
  transform: translateY(200px);
}

.shreds-container {
  position: absolute;
  top: 150px;
  left: 0;
  width: 100%;
  height: 200px;
  opacity: 0;
}

.shreds-container.shredding-active {
  opacity: 1;
}

.shred {
  position: absolute;
  top: -100px;
  width: 8%;
  height: 100px;
  background-color: white;
  border-left: 1px solid #f1f3f5;
  border-right: 1px solid #f1f3f5;
  box-shadow: 1px 0 3px rgba(0,0,0,0.05);
  transform-origin: top center;
}

.shredding-active .shred {
  animation: fallShreds 2.5s linear forwards;
}

@keyframes fallShreds {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(250px) rotate(calc(-10deg + 20deg * var(--random, 0.5))); opacity: 0; }
}

.fade-in-out {
  animation: fadeInOut 2s infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Box Breathing Animation */
.breathing-container {
  width: 280px;
  height: 280px;
}

.breathing-box {
  width: 100%;
  height: 100%;
  border: 2px solid rgba(44, 82, 130, 0.2);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.breathing-indicator {
  position: absolute;
  background-color: rgba(44, 82, 130, 0.1);
  transition: all 4s linear;
}

.breathing-indicator.inhale {
  bottom: 0; left: 0; right: 0;
  height: 100%;
  border-bottom: 4px solid #2c5282;
}

.breathing-indicator.hold-in {
  top: 0; left: 0; right: 0;
  height: 100%;
  background-color: rgba(44, 82, 130, 0.2);
  border-top: 4px solid #2c5282;
  transition: all 0.1s;
}

.breathing-indicator.exhale {
  top: 0; left: 0; right: 0;
  height: 0%;
  background-color: rgba(44, 82, 130, 0.1);
  border-top: 4px solid #2c5282;
}

.breathing-indicator.hold-out {
  bottom: 0; left: 0; right: 0;
  height: 0%;
  border-bottom: 4px solid transparent;
  transition: all 0.1s;
}

.fade-in {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 576px) {
  .breathing-container {
    width: 240px;
    height: 240px;
  }
}
</style>
