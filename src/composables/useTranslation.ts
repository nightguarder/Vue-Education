// Translation composable using ONNX WebGPU model or OMLX fallback
import { ref } from 'vue'

const TRANSLATION_MODEL_WEBGPU = 'm1cc0z/translategemma-4b-it-onnx-q4-webgpu'
const TRANSLATION_MODEL_FALLBACK = 'Xenova/LaMini-Flan-T5-248M'

// OMLX Configuration
const OMLX_PORT = import.meta.env.VITE_OMLX_PORT || '8080'
const OMLX_API_KEY = import.meta.env.VITE_OMLX_API_KEY || '1234'
const OMLX_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit'

function getOmlxUrl(): string {
  const isProd = import.meta.env.PROD
  return isProd
    ? `http://127.0.0.1:${OMLX_PORT}/v1/chat/completions`
    : '/omlx/chat/completions'
}

const isLoading = ref(false)
const isReady = ref(false)
const downloadProgress = ref(0)
const error = ref<string | null>(null)
const useOmlx = ref(false)

let translationPipeline: any = null

const fallbackTranslations: Record<string, Record<string, string>> = {
  'en-cs': {
    'anxiety': 'úzkost',
    'depression': 'deprese',
    'treatment': 'léčba',
    'therapy': 'terapie',
    'symptoms': 'příznaky',
    'patient': 'pacient',
    'research': 'výzkum',
    'study': 'studie',
    'mental health': 'duševní zdraví',
    'cognitive': 'kognitivní'
  },
  'cs-en': {
    'úzkost': 'anxiety',
    'deprese': 'depression',
    'léčba': 'treatment',
    'terapie': 'therapy',
    'příznaky': 'symptoms',
    'pacient': 'patient',
    'výzkum': 'research',
    'studie': 'study',
    'duševní zdraví': 'mental health',
    'kognitivní': 'cognitive'
  }
}

function isWebGPUSupported(): boolean {
  return !!(navigator as any).gpu
}

export function useTranslation() {
  async function tryOmlx(): Promise<boolean> {
    try {
      const response = await fetch(getOmlxUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OMLX_API_KEY}`
        },
        body: JSON.stringify({
          model: OMLX_MODEL,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      })

      if (response.ok || response.status === 400) {
        useOmlx.value = true
        isReady.value = true
        console.log('[Translation] OMLX service available')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function loadModel(): Promise<boolean> {
    if (translationPipeline || useOmlx.value) {
      isReady.value = true
      return true
    }

    isLoading.value = true
    downloadProgress.value = 0
    error.value = null

    // Try WebGPU first
    if (isWebGPUSupported()) {
      try {
        const { pipeline, env } = await import(
          /* @vite-ignore */
          '@huggingface/transformers'
        )

        env.logLevel = 0
        env.allowLocalModels = false
        env.allowRemoteModels = true

        console.log('[Translation] Loading WebGPU model:', TRANSLATION_MODEL_WEBGPU)
        
        translationPipeline = await pipeline('translation', TRANSLATION_MODEL_WEBGPU, {
          device: 'webgpu',
          dtype: 'q4f16',
          progress_callback: (x: any) => {
            if (x.status === 'progress' && x.progress) {
              downloadProgress.value = x.progress
            }
          }
        })

        console.log('[Translation] WebGPU model loaded successfully')
        isReady.value = true
        return true
      } catch (e: any) {
        console.warn('[Translation] WebGPU model failed:', e.message)
      }
    } else {
      console.log('[Translation] WebGPU not supported, skipping...')
    }

    // Try fallback ONNX model
    try {
      const { pipeline, env } = await import(
        /* @vite-ignore */
        '@huggingface/transformers'
      )
      
      env.allowLocalModels = false
      
      translationPipeline = await pipeline('translation', TRANSLATION_MODEL_FALLBACK, {
        device: 'webgpu',
        dtype: 'q4f16',
        progress_callback: (x: any) => {
          if (x.status === 'progress' && x.progress) {
            downloadProgress.value = x.progress * 50
          }
        }
      })
      
      isReady.value = true
      console.log('[Translation] Fallback model loaded')
      return true
    } catch (fallbackError: any) {
      console.warn('[Translation] Fallback ONNX model failed:', fallbackError.message)
    }

    // Try OMLX as fallback
    const omlxAvailable = await tryOmlx()
    if (omlxAvailable) {
      return true
    }

    error.value = 'No translation model available (WebGPU not supported, ONNX failed, OMLX unavailable)'
    isLoading.value = false
    return false
  }

  async function translate(text: string, targetLang: 'en' | 'cs'): Promise<string> {
    if (!text.trim()) return ''

    // Use OMLX if available
    if (useOmlx.value) {
      try {
        const sourceLang = targetLang === 'en' ? 'Czech' : 'English'
        const targetLabel = targetLang === 'en' ? 'English' : 'Czech'
        
        const response = await fetch(getOmlxUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OMLX_API_KEY}`
          },
          body: JSON.stringify({
            model: OMLX_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a medical translator. Translate the following text accurately. Output only the translation, no explanations.'
              },
              { role: 'user', content: `Translate from ${sourceLang} to ${targetLabel}: ${text}` }
            ],
            max_tokens: 1024,
            temperature: 0.3
          })
        })

        if (response.ok) {
          const data = await response.json()
          const translated = data.choices?.[0]?.message?.content?.trim()
          if (translated) return translated
        }
      } catch (e: any) {
        console.warn('[Translation] OMLX translation failed:', e.message)
      }
    }

    // Use ONNX pipeline if available
    if (translationPipeline) {
      try {
        const sourceLang = targetLang === 'en' ? 'cs' : 'en'
        const task = `translate ${sourceLang} to ${targetLang}`
        const result = await translationPipeline(task)
        return result?.[0]?.translation_text || text
      } catch (e: any) {
        console.warn('[Translation] ONNX translation failed:', e.message)
      }
    }

    // Fallback: simple word replacement
    const langKey = targetLang === 'en' ? 'en-cs' : 'cs-en'
    const dictionary = fallbackTranslations[langKey] || {}
    let translated = text
    
    for (const [word, translation] of Object.entries(dictionary)) {
      const regex = new RegExp(word, 'gi')
      translated = translated.replace(regex, () => targetLang === 'en' ? translation : word)
    }

    if (translated === text) {
      return `[${targetLang.toUpperCase()}] ${text}`
    }

    return translated
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