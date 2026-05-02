// Composable for Stress Relief AI responses via browser-based WebGPU models
import { ref } from 'vue'

const isLoading = ref(false)
const isReady = ref(false)
const error = ref<string | null>(null)

// WebGPU browser model (LFM2.5)
let browserPipeline: any = null
const BROWSER_MODEL = 'postgrammar/LFM2.5-1.2B-Thinking-ONNX' // Approximation for LFM2.5 1.2B Thinking
const downloadProgress = ref(0)
const isDownloading = ref(false)



// Fallback responses if browser model fails
const fallbackResponses = [
  "Your feelings are valid. It's okay to feel what you're feeling.",
  "Every day is a new opportunity. You're stronger than you think.",
  "Don't give up. Small steps lead to big changes.",
  "You matter exactly as you are.",
  "It's okay to ask for help.",
  "The future is full of possibilities.",
  "Feelings are temporary. This moment will pass too.",
  "You're more resilient than you realize."
]

// Theme detection and prompts
const themeKeywords: Record<string, string[]> = {
  'sadness': ['sad', 'depressed', 'down', 'unhappy', 'grief', 'lonely'],
  'anxiety': ['anxious', 'worried', 'stress', 'nervous', 'panic', 'overwhelmed'],
  'fear': ['scared', 'afraid', 'fear', 'terrified'],
  'anger': ['angry', 'mad', 'frustrated', 'annoyed'],
  'tired': ['tired', 'exhausted', 'sleepy', 'fatigue'],
  'hope': ['hopeless', 'lost', 'confused', 'purpose', 'meaning']
}

const themePrompts: Record<string, string> = {
  'sadness': 'Generate a short inspirational quote about finding light in darkness and that difficult feelings pass. Max 2 sentences.',
  'anxiety': 'Generate a short calming quote about finding peace and that worrying does not help. Max 2 sentences.',
  'fear': 'Generate a short encouraging quote about being brave and that fear is temporary. Max 2 sentences.',
  'anger': 'Generate a short quote about releasing anger and finding inner calm. Max 2 sentences.',
  'tired': 'Generate a short quote about rest and that it is okay to pause. Max 2 sentences.',
  'hope': 'Generate a short hopeful quote about new beginnings and that things can get better. Max 2 sentences.'
}

function detectTheme(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return theme
    }
  }
  return null
}

function cleanResponse(text: string): string {
  return text
    .replace(/^Generate[,:]\s*/i, '')
    .replace(/^Give me[,:]\s*/i, '')
    .replace(/^A short[,:]\s*/i, '')
    .replace(/^Here[,:]\s*/i, '')
    .replace(/^Sure[,:]\s*/i, '')
    .replace(/^Of course[,:]\s*/i, '')
    .replace(/^I cannot[,:]\s*/i, '')
    .trim()
}

export function useStressReliefAI() {
  function isDownloadAllowed(): boolean {
    if (!navigator.onLine) return false
    
    // Check if WebGPU is supported
    if (!navigator.gpu) return false

    const conn = (navigator as any).connection
    if (conn) {
      if (conn.saveData) return false
      if (['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return false
    }
    return true
  }

  async function loadModel(): Promise<boolean> {
    if (browserPipeline) {
      isReady.value = true
      return true
    }

    if (!isDownloadAllowed()) {
      console.log('[StressReliefAI] Download skipped due to network constraints or missing WebGPU.')
      return false
    }

    // Load browser-based WebGPU model
    try {
      isLoading.value = true
      isDownloading.value = true
      const { pipeline, env } = await import(
        /* @vite-ignore */
        '@huggingface/transformers'
      )

      // Configure for browser
      if (typeof env.logLevel === 'number') {
        env.logLevel = 0
      }
      env.allowLocalModels = false
      env.allowRemoteModels = true

      console.log('[StressReliefAI] Loading browser model:', BROWSER_MODEL)
      browserPipeline = await pipeline('text-generation', BROWSER_MODEL, {
        device: 'webgpu',
        dtype: 'q4f16', // Ensure correct quantized loading from Transformers.js
        progress_callback: (x: any) => {
          if (x.status === 'progress' && x.progress) {
            downloadProgress.value = x.progress
          }
        }
      })

      console.log('[StressReliefAI] Browser model loaded successfully')
      isReady.value = true
      isDownloading.value = false
      return true
    } catch (e: any) {
      console.warn('[StressReliefAI] Browser model load failed:', e.message)
      isReady.value = false
      isDownloading.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  function parseThought(text: string): string {
    return text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()
  }

  async function generateResponse(stressText: string): Promise<string> {
    const normalizedText = stressText.trim()
    if (!normalizedText) return getRandomQuote()

    // Use browser model
    if (browserPipeline) {
      try {
        const theme = detectTheme(normalizedText)
        let prompt = theme && themePrompts[theme]
          ? themePrompts[theme]
          : 'Generate a short inspirational quote about inner peace and strength. Max 2 sentences.'

        // Using simple prompting for LFM2.5 base model
        const output = await browserPipeline(prompt, {
          max_new_tokens: 50,
          temperature: 0.7,
          repetition_penalty: 1.1,
          do_sample: true,
        })

        let quote = output[0]?.generated_text || ''
        
        // Remove the prompt from the generated text if it's there
        if (quote.startsWith(prompt)) {
          quote = quote.substring(prompt.length).trim()
        }

        quote = cleanResponse(parseThought(quote))

        if (quote && quote.length > 5) {
          return quote
        }
      } catch (e: any) {
        console.warn('[StressReliefAI] Browser model generation failed:', e.message)
      }
    }

    return getRandomQuote()
  }

  async function generateDailyQuote(): Promise<string> {
    return generateResponse('Generate a short inspirational quote to start the day. Max 2 sentences.')
  }

  function getRandomQuote(): string {
    const idx = Math.floor(Math.random() * fallbackResponses.length)
    return fallbackResponses[idx] || "You're stronger than you think."
  }

  function isModelReady(): boolean {
    return isReady.value
  }

  return {
    isLoading,
    isReady,
    isDownloading,
    downloadProgress,
    error,
    loadModel,
    generateResponse,
    generateDailyQuote,
    getRandomQuote,
    isModelReady,
    isDownloadAllowed
  }
}

