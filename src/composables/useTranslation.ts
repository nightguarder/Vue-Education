// Translation service using Translator class
import { ref } from 'vue'
import Translator from '@/services/Translator'

const isLoading = ref(false)
const isReady = ref(false)
const downloadProgress = ref(0)
const error = ref<string | null>(null)

export function useTranslation() {
  const translator: Translator = Translator.getInstance()

  async function loadModel(): Promise<boolean> {
    if (translator.isReady()) {
      isReady.value = true
      return true
    }

    isLoading.value = true
    downloadProgress.value = 0
    error.value = null

    try {
      await translator.init((progress) => {
        downloadProgress.value = progress
      })
      isReady.value = true
      console.log('[Translation] Model loaded successfully')
      return true
    } catch (e: any) {
      console.warn('[Translation] Model load failed:', e.message)
      error.value = e.message
      isReady.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function translate(text: string, targetLang: 'en' | 'cs'): Promise<string> {
    if (!text.trim()) return ''

    if (!translator.isReady()) {
      await loadModel()
    }

    try {
      const sourceLang = targetLang === 'en' ? 'cs' : 'en'
      return await translator.translate(text, sourceLang, targetLang)
    } catch (e: any) {
      console.warn('[Translation] Failed:', e.message)
      return text
    }
  }

  async function translateToEnglish(text: string): Promise<string> {
    return translate(text, 'en')
  }

  async function translateToCzech(text: string): Promise<string> {
    return translate(text, 'cs')
  }

  return {
    isLoading,
    isReady,
    downloadProgress,
    error,
    loadModel,
    translate,
    translateToEnglish,
    translateToCzech
  }
}