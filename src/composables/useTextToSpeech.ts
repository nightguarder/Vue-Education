import { ref } from 'vue'

export function useTextToSpeech() {
  const isLoading = ref(false)
  const isSpeaking = ref(false)
  const isReady = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  let worker: Worker | null = null
  let currentPromise: { resolve: Function; reject: Function } | null = null

  async function init(voiceId: string): Promise<boolean> {
    if (worker) {
      worker.terminate()
      worker = null
      isReady.value = false
    }

    isLoading.value = true
    error.value = null

    try {
      worker = new Worker(
        new URL('../workers/tts.worker.ts', import.meta.url),
        { type: 'module' }
      )

      return new Promise((resolve) => {
        worker!.onmessage = (e: MessageEvent) => {
          const { type, id, error: errMsg } = e.data

          if (type === 'init_done') {
            isLoading.value = false
            isReady.value = true
            console.log('[TTS] Model loaded successfully')
            resolve(true)
          } else if (type === 'error' && id === 'init') {
            isLoading.value = false
            isReady.value = false
            error.value = `Failed to initialize TTS: ${errMsg}`
            worker?.terminate()
            worker = null
            resolve(false)
          }
        }

        worker!.postMessage({
          type: 'init',
          id: 'init',
          payload: { voiceId }
        })
      })
    } catch (err) {
      isLoading.value = false
      isReady.value = false
      error.value = `Failed to create worker: ${err instanceof Error ? err.message : String(err)}`
      return false
    }
  }

  async function speak(text: string): Promise<void> {
    if (!worker) {
      throw new Error('TTS not initialized. Call init() first.')
    }

    isSpeaking.value = true
    error.value = null

    return new Promise((resolve, reject) => {
      currentPromise = { resolve, reject }

      worker!.onmessage = (e: MessageEvent) => {
        const { type, buffer, error: errMsg } = e.data

        if (type === 'audio_ready') {
          const audio = new Audio()
          audio.src = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))

          audio.onended = () => {
            isSpeaking.value = false
            URL.revokeObjectURL(audio.src)
            currentPromise = null
            resolve()
          }

          audio.onerror = () => {
            isSpeaking.value = false
            URL.revokeObjectURL(audio.src)
            currentPromise = null
            reject(new Error('Audio playback failed'))
          }

          audio.play()
        } else if (type === 'error') {
          isSpeaking.value = false
          error.value = `TTS synthesis failed: ${errMsg}`
          currentPromise = null
          reject(new Error(errMsg))
        }
      }

      worker!.postMessage({
        type: 'synthesize',
        id: 'synth_' + Date.now(),
        payload: { text }
      })
    })
  }

  function stop() {
    if (worker) {
      worker.postMessage({ type: 'terminate', id: 'stop_' + Date.now() })
      worker.terminate()
      worker = null
    }
    isSpeaking.value = false
    isReady.value = false

    if (currentPromise) {
      currentPromise.resolve()
      currentPromise = null
    }
  }

  return {
    isLoading,
    isSpeaking,
    isReady,
    progress,
    error,
    init,
    speak,
    stop,
  }
}
