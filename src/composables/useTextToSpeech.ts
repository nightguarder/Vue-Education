import { ref } from 'vue'
import TextToSpeech, { type VoiceOption } from '@/services/TextToSpeech'

const isLoading = ref(false)
const isReady = ref(false)
const isSpeaking = ref(false)
const downloadProgress = ref(0)
const error = ref<string | null>(null)
const currentAudio = ref<HTMLAudioElement | null>(null)

export function useTextToSpeech() {
  const tts = TextToSpeech.getInstance()

  async function loadModel(): Promise<boolean> {
    if (tts.isReady()) {
      isReady.value = true
      return true
    }

    isLoading.value = true
    downloadProgress.value = 0
    error.value = null

    try {
      await tts.init((progress) => {
        downloadProgress.value = progress
      })
      isReady.value = true
      console.log('[TTS] Model loaded successfully')
      return true
    } catch (e: any) {
      console.error('[TTS] Model load failed:', e.message)
      error.value = e.message
      isReady.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function speak(text: string, voiceId?: string): Promise<void> {
    if (!text.trim()) return
    if (!tts.isReady()) {
      await loadModel()
    }

    // Stop any current playback
    stop()

    isSpeaking.value = true
    error.value = null

    try {
      const audioData = await tts.synthesize(text, voiceId)
      
      // Convert Float32Array to WAV blob and play
      const wavBlob = float32ToWav(audioData, 16000)
      const url = URL.createObjectURL(wavBlob)
      
      const audio = new Audio(url)
      currentAudio.value = audio
      
      audio.onended = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
        currentAudio.value = null
      }
      
      audio.onerror = () => {
        isSpeaking.value = false
        URL.revokeObjectURL(url)
        currentAudio.value = null
      }
      
      await audio.play()
    } catch (e: any) {
      console.error('[TTS] Synthesis failed:', e.message)
      error.value = e.message
      isSpeaking.value = false
    }
  }

  function stop() {
    if (currentAudio.value) {
      currentAudio.value.pause()
      currentAudio.value.currentTime = 0
      currentAudio.value = null
    }
    isSpeaking.value = false
  }

  function getVoices(): VoiceOption[] {
    return tts.getVoices()
  }

  // Helper to convert Float32Array to WAV blob
  function float32ToWav(audioData: Float32Array, sampleRate: number): Blob {
    const numChannels = 1
    const bitsPerSample = 16
    const blockAlign = numChannels * bitsPerSample / 8
    const byteRate = sampleRate * blockAlign
    const dataSize = audioData.length * 2 // 16-bit = 2 bytes per sample
    
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    
    // WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)
    
    // Convert Float32 to Int16
    let offset = 44
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
    
    return new Blob([buffer], { type: 'audio/wav' })
  }

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  return {
    isLoading,
    isReady,
    isSpeaking,
    downloadProgress,
    error,
    loadModel,
    speak,
    stop,
    getVoices,
  }
}
