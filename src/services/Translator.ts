import { pipeline, env, type DataType } from '@huggingface/transformers'

// Explicitly enable browser cache for the transformers library
env.useBrowserCache = true

class Translator {
  private static instance: Translator | null = null
  private pipeline: any = null
  private static modelId: string = 'onnx-community/translategemma-text-4b-it-ONNX'
  private static dtype: DataType = 'q4'
  public static size: number = 3111894696
  private useApi: boolean = true

  private constructor() {}

  public static getInstance(): Translator {
    if (!Translator.instance) {
      Translator.instance = new Translator()
    }
    return Translator.instance
  }

  public setUseApi(use: boolean) {
    this.useApi = use
  }

  public async init(onProgress?: (progress: number) => void) {
    if (this.pipeline) return

    // If we're using the API, we don't strictly need the local model,
    // but we can load it as a background fallback if requested.
    // For now, we only load if API is disabled or explicitly requested.
    if (this.useApi) {
      console.log('[Translator] Using API for translation')
      return
    }

    const loaded = new Map<string, number>()
    let newProgress = 0

    this.pipeline = await pipeline('text-generation', Translator.modelId, {
      progress_callback: (e: any) => {
        if (e.status === 'progress') {
          loaded.set(e.file, e.loaded)
          const allLoaded = Array.from(loaded.values()).reduce(
            (acc: number, curr: number) => acc + curr,
            0,
          )
          const percentLoaded = Math.round((100 / Translator.size) * allLoaded * 100) / 100
          if (newProgress !== percentLoaded) {
            newProgress = percentLoaded
            onProgress?.(newProgress)
          }
        }
      },
      device: 'webgpu',
      dtype: Translator.dtype,
    })
  }

  public async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (this.useApi) {
      try {
        const useStructured = !(sourceLang === 'en' && targetLang === 'cs')
        const messages = [
          {
            role: 'user',
            content: useStructured
              ? [
                  {
                    type: 'text',
                    source_lang_code: sourceLang,
                    target_lang_code: targetLang,
                    text,
                  },
                ]
              : text,
          },
        ]

        const response = await fetch('/omlx/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OMLX_API_KEY || '5004'}`,
          },
          body: JSON.stringify({
            model: 'translategemma-4b-it-8bit',
            messages,
            max_tokens: 2048,
            stop: ['<end_of_turn>'],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content || ''
          // Handle the trailing <end_of_turn> if present
          return content.split('<end_of_turn>')[0].trim()
        }
        console.warn('[Translator] API response not OK:', response.status, response.statusText)
      } catch (e) {
        console.error('[Translator] API call failed:', e)
      }
    }

    if (!this.pipeline) {
      throw new Error('Translator not initialized and API unavailable.')
    }

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            source_lang_code: sourceLang,
            target_lang_code: targetLang,
            text,
          },
        ],
      },
    ]

    const output = await this.pipeline(messages, {
      max_new_tokens: 1024,
    })

    return output[0].generated_text.pop().content
  }

  public isReady(): boolean {
    return this.useApi || (this.pipeline !== undefined && this.pipeline !== null)
  }
}

export default Translator
