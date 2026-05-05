import { pipeline, env, type DataType } from '@huggingface/transformers'

// Enable browser cache
env.useBrowserCache = true

type VoiceOption = {
  id: string
  name: string
  speakerId?: number
}

class TextToSpeech {
  private static instance: TextToSpeech | null = null
  private ttsPipeline: any = null
  private static modelId: string = 'onnx-community/mms-tts-ces'
  private static dtype: DataType = 'q4'
  private static modelSize: number = 180000000 // ~180MB estimate

  // Available voices for Czech
  private static voices: VoiceOption[] = [
    { id: 'cs_CZ-jirka-medium', name: 'Jirka (Medium)', speakerId: 0 },
    { id: 'cs_CZ-thomcles-high', name: 'Thomcles (High)', speakerId: 1 },
  ]

  private constructor() {}

  public static getInstance(): TextToSpeech {
    if (!TextToSpeech.instance) {
      TextToSpeech.instance = new TextToSpeech()
    }
    return TextToSpeech.instance
  }

  public async init(onProgress?: (progress: number) => void) {
    if (this.ttsPipeline) return

    const loaded = new Map<string, number>()
    let newProgress = 0

    try {
      this.ttsPipeline = await pipeline('text-to-speech', TextToSpeech.modelId, {
        progress_callback: (e: any) => {
          if (e.status === 'progress') {
            loaded.set(e.file, e.loaded)
            const allLoaded = Array.from(loaded.values()).reduce((acc, curr) => acc + curr, 0)
            const percentLoaded = Math.round((100 / TextToSpeech.modelSize) * allLoaded * 100) / 100
            if (newProgress !== percentLoaded) {
              newProgress = percentLoaded
              onProgress?.(newProgress)
            }
          }
        },
        device: 'webgpu',
        dtype: TextToSpeech.dtype,
      })
      console.log('[TTS] Model loaded successfully')
    } catch (error) {
      console.warn('[TTS] WebGPU not available, falling back to WASM...')
      // Fallback to WASM
      this.ttsPipeline = await pipeline('text-to-speech', TextToSpeech.modelId, {
        progress_callback: (e: any) => {
          if (e.status === 'progress') {
            loaded.set(e.file, e.loaded)
            const allLoaded = Array.from(loaded.values()).reduce((acc, curr) => acc + curr, 0)
            const percentLoaded = Math.round((100 / TextToSpeech.modelSize) * allLoaded * 100) / 100
            if (newProgress !== percentLoaded) {
              newProgress = percentLoaded
              onProgress?.(newProgress)
            }
          }
        },
        device: 'wasm',
        dtype: TextToSpeech.dtype,
      })
    }
  }

  public async synthesize(text: string, voiceId?: string): Promise<Float32Array> {
    if (!this.ttsPipeline) {
      throw new Error('TTS not initialized. Call init() first.')
    }

    const voice = TextToSpeech.voices.find(v => v.id === voiceId)
    const speakerId = voice?.speakerId ?? 0

    const output = await this.ttsPipeline(text, {
      speaker_id: speakerId,
      sampling_rate: 16000,
    })

    return output.audio
  }

  public getVoices(): VoiceOption[] {
    return TextToSpeech.voices
  }

  public isReady(): boolean {
    return this.ttsPipeline !== null && this.ttsPipeline !== undefined
  }
}

export default TextToSpeech
export type { VoiceOption }
