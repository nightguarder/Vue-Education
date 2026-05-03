// src/composables/useSpeechToText.ts
import { ref, reactive } from 'vue'

const isLoading = ref(false)
const isReady = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const error = ref<string | null>(null)
const currentLang = ref('cs-CZ') // Default Czech

let recognition: any = null
let finalTranscript = ''

function createRecognition(lang: string) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return null
  
  const rec = new SpeechRecognition()
  rec.continuous = true
  rec.interimResults = true
  rec.lang = lang
  rec.maxAlternatives = 1
  
  return rec
}

export function useSpeechToText() {
  const state = reactive({
    transcript: ''
  })
  
  async function loadModel(lang?: string): Promise<boolean> {
    if (recognition) {
      isReady.value = true
      return true
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('[SpeechToText] Initializing Web Speech API...')
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser')
      }
      
      const langToUse = lang || currentLang.value
      recognition = createRecognition(langToUse)
      
      if (!recognition) {
        throw new Error('Failed to create recognition object')
      }

      let interim = ''
      
      recognition.onresult = (event: any) => {
        interim = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
            state.transcript = finalTranscript.trim()
          } else {
            interim += transcript
          }
        }
        
        console.log('[SpeechToText] Interim:', interim)
      }
      
      recognition.onerror = (event: any) => {
        console.error('[SpeechToText] Error:', event.error)
        isRecording.value = false
        
        if (event.error === 'not-allowed') {
          error.value = 'Microphone access denied. Please allow microphone access.'
        } else if (event.error === 'no-speech') {
          error.value = 'No speech detected. Please try again.'
        } else if (event.error === 'network') {
          error.value = 'Network error. Please check your connection.'
        } else if (event.error === 'aborted') {
          error.value = ''
        } else {
          error.value = `Speech recognition error: ${event.error}`
        }
      }
      
      recognition.onend = () => {
        console.log('[SpeechToText] Recognition ended')
        isRecording.value = false
        // Don't nullify recognition so we can reuse it
      }
      
      console.log('[SpeechToText] Web Speech API initialized:', langToUse)
      isReady.value = true
      return true
    } catch (e: any) {
      console.error('[SpeechToText] Init failed:', e.message)
      error.value = `Speech recognition not available: ${e.message}`
      recognition = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function startRecording(lang?: string): Promise<boolean> {
    if (isRecording.value) return true
    
    if (!recognition) {
      const loaded = await loadModel(lang || currentLang.value)
      if (!loaded) return false
    }

    if (!recognition) {
      return false
    }

    try {
      finalTranscript = ''
      state.transcript = ''
      if (lang) {
        recognition.lang = lang
        currentLang.value = lang
      }
      recognition.start()
      isRecording.value = true
      console.log('[SpeechToText] Recording started')
      return true
    } catch (e: any) {
      console.error('[SpeechToText] Start failed:', e.message)
      error.value = `Failed to start recording: ${e.message}`
      return false
    }
  }

  function stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (!recognition) {
        resolve(finalTranscript.trim())
        return
      }
      
      const timeout = setTimeout(() => {
        isRecording.value = false
        resolve(finalTranscript.trim())
      }, 500)
      
      const oldOnEnd = recognition.onend
      recognition.onend = () => {
        clearTimeout(timeout)
        isRecording.value = false
        resolve(finalTranscript.trim())
        if (oldOnEnd) oldOnEnd()
      }
      
      try {
        recognition.stop()
      } catch (e: any) {
        clearTimeout(timeout)
        isRecording.value = false
        resolve(finalTranscript.trim())
      }
    })
  }

  function getTranscript(): string {
    return state.transcript || finalTranscript.trim()
  }

  function resetTranscript() {
    finalTranscript = ''
    state.transcript = ''
  }

  function setLanguage(lang: string) {
    currentLang.value = lang
    if (recognition) {
      recognition.lang = lang
    }
  }

  return {
    isLoading,
    isReady,
    isRecording,
    isProcessing,
    error,
    state,
    loadModel,
    startRecording,
    stopRecording,
    getTranscript,
    resetTranscript,
    setLanguage
  }
}
