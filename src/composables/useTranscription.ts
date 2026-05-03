// Transcription composable using Parakeet ONNX model via onnxruntime-web
import { ref } from 'vue'
import * as ort from 'onnxruntime-web'

const MODEL_ID = 'm1cc0z/parakeet-tdt-0.6b-v3-onnx'
const MODEL_BASE = `https://huggingface.co/${MODEL_ID}/resolve/main`
const MAX_AUDIO_DURATION_SECONDS = 24 * 60

// OMLX Configuration
const OMLX_PORT = import.meta.env.VITE_OMLX_PORT || '8080'
const OMLX_API_KEY = import.meta.env.VITE_OMLX_API_KEY || '1234'
const PARAKEEET_MODEL = import.meta.env.VITE_PARAKEEET_MODEL || 'parakeet-tdt-0.6b-v3'

const isLoading = ref(false)
const isReady = ref(false)
const downloadProgress = ref(0)
const error = ref<string | null>(null)
const isWebGPU = ref(false)
const useLocalModel = ref(true) // Toggle: true = WebGPU local, false = OMLX

let encoderSession: ort.InferenceSession | null = null
let decoderSession: ort.InferenceSession | null = null
let vocab: Map<number, string> = new Map()

export function useTranscription() {
  async function loadModel(): Promise<boolean> {
    if (isReady.value && encoderSession && decoderSession) return true

    isLoading.value = true
    downloadProgress.value = 0
    error.value = null

    try {
      if (import.meta.env.DEV) console.log("[Transcription] Initializing ONNX transcription engine...")
      
      // Check WebGPU availability
      isWebGPU.value = !!(navigator as any)?.gpu
      const variant = isWebGPU.value ? 'fp16' : 'int8'
      
      const totalFiles = 3
      let loaded = 0

      // 1. Load vocab.txt tokenizer (browser-compatible)
      loaded++
      downloadProgress.value = (loaded / totalFiles) * 100
      if (import.meta.env.DEV) console.log("[Transcription] Loading vocab...")
      
      const vocabFilename = '0ee587b5d4b94f48993dcccf9868ea77_tokenizer.vocab'
      const vocabUrl = `${MODEL_BASE}/tokenizer/${vocabFilename}`
      const vocabText = await (await fetchWithCache(vocabUrl)).text()
      
      // Parse vocab (SentencePiece format: <token>\t<score>)
      vocab = new Map()
      const lines = vocabText.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim()
        if (!line) continue
        
        // It's tab-separated, we just want the token
        const parts = line.split('\t')
        let token = parts[0] || ''
        
        // Handle SentencePiece space marker (▁ U+2581)
        if (token === '▁' || token.startsWith('▁')) {
          token = token.replace(/▁/g, ' ')
        }
        
        // Handle special tokens
        if (token.startsWith('<')) {
          token = '' // ignore special tokens in output
        }
        
        vocab.set(i, token)
      }
      console.log('[Transcription] Vocab loaded, size:', vocab.size)

      // 2. Load encoder
      loaded++
      downloadProgress.value = (loaded / totalFiles) * 100
      console.log(`[Transcription] Loading encoder (${variant})...`)
      
      const encoderProviders = isWebGPU.value 
        ? [{ name: 'webgpu' }] 
        : [{ name: 'wasm' }]

      if (variant === 'fp16') {
        // fp16 uses external data, must be loaded via ArrayBuffer and mapped
        const encoderUrl = `${MODEL_BASE}/${variant}/encoder.onnx`
        const encoderDataUrl = `${MODEL_BASE}/${variant}/encoder.onnx.data`
        
        console.log('[Transcription] Fetching fp16 model buffers (using cache if available)...')
        const [modelResponse, dataResponse] = await Promise.all([
          fetchWithCache(encoderUrl),
          fetchWithCache(encoderDataUrl)
        ])
        
        if (!modelResponse.ok || !dataResponse.ok) throw new Error('Failed to fetch FP16 encoder components')

        const modelBuffer = await modelResponse.arrayBuffer()
        const dataBuffer = await dataResponse.arrayBuffer()
        
        encoderSession = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: encoderProviders,
          graphOptimizationLevel: 'all',
          externalData: [
            {
              path: 'encoder.onnx.data', // Must match exactly what ORT looks for internally
              data: new Uint8Array(dataBuffer)
            }
          ]
        })
      } else {
        // int8 is a single file, can be loaded safely via URL or single buffer
        const encoderUrl = `${MODEL_BASE}/${variant}/encoder.onnx`
        const modelBuffer = await (await fetchWithCache(encoderUrl)).arrayBuffer()
        
        encoderSession = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: encoderProviders,
          graphOptimizationLevel: 'all'
        })
      }
      console.log('[Transcription] Encoder loaded')

      // 3. Load decoder_joint
      loaded++
      downloadProgress.value = (loaded / totalFiles) * 100
      console.log('[Transcription] Loading decoder...')
      
      const decoderUrl = `${MODEL_BASE}/decoder_joint.onnx`
      const decoderBuffer = await (await fetchWithCache(decoderUrl)).arrayBuffer()
      
      decoderSession = await ort.InferenceSession.create(decoderBuffer, {
        executionProviders: encoderProviders
      })
      console.log('[Transcription] Decoder loaded')

      isReady.value = true
      isLoading.value = false
      return true
    } catch (e: any) {
      console.error('[Transcription] Model load failed:', e)
      error.value = `Model loading failed: ${e.message}`
      
      // Try OMLX fallback
      return await checkOmlxFallback()
    } finally {
      isLoading.value = false
    }
  }

  // Helper to fetch with Cache API
  async function fetchWithCache(url: string): Promise<Response> {
    try {
      const cache = await caches.open('onnx-models-cache-v1')
      const cachedResponse = await cache.match(url)
      if (cachedResponse) {
        console.log(`[Cache] HIT: ${url}`)
        return cachedResponse
      }
      
      console.log(`[Cache] MISS: Fetching ${url}`)
      const response = await fetch(url)
      if (response.ok) {
        // Clone before putting in cache
        await cache.put(url, response.clone())
      }
      return response
    } catch {
      // Fallback to normal fetch if Cache API fails (e.g. some incognito modes)
      return fetch(url)
    }
  }

  async function checkOmlxFallback(): Promise<boolean> {
    try {
      const response = await fetch(
        import.meta.env.PROD 
          ? `http://127.0.0.1:${OMLX_PORT}/v1/chat/completions`
          : '/omlx/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OMLX_API_KEY}`
          },
          body: JSON.stringify({
            model: import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          })
        }
      )

      if (response.ok || response.status === 400) {
        isReady.value = true
        isWebGPU.value = false
        console.log('[Transcription] Using OMLX fallback')
        return true
      }
      console.warn('[Transcription] OMLX fallback failed')
    } catch (e) {
      console.error(e)
    }
    error.value = 'No transcription engine available'
    return false
  }

  async function transcribeAudio(audioFile: File): Promise<string> {
    if (!isReady.value && useLocalModel.value) throw new Error('Model not loaded')

    const duration = await getAudioDuration(audioFile)
    
    // Use OMLX if toggle is off OR fallback conditions met
    if (!useLocalModel.value || duration > MAX_AUDIO_DURATION_SECONDS || !isWebGPU.value || !encoderSession) {
      console.log(`[Transcription] Using OMLX (Duration: ${Math.round(duration)}s, LocalModel: ${useLocalModel.value})`)
      return await transcribeWithOMLX(audioFile)
    }

    try {
      // Get audio as mel spectrogram
      const { mel, length } = await audioToMelSpectrogram(audioFile)
      
      // Encoder input
      const audioSignal = new ort.Tensor('float32', mel, [1, 128, length])
      const lengthTensor = new ort.Tensor('int64', new BigInt64Array([BigInt(length)]), [1])

      console.log('[Transcription] Running encoder...')
      if (!encoderSession) throw new Error('Encoder not loaded')
      
      const encoderOut = await encoderSession.run({
        audio_signal: audioSignal,
        length: lengthTensor
      })

      const outputName = encoderSession.outputNames[0]
      if (!outputName) throw new Error('No encoder output')
      
      const encoded = encoderOut[outputName]
      if (!encoded) throw new Error('Encoder output is empty')
      console.log('[Transcription] Encoder output shape:', encoded.dims)

      // Decoder - simplified greedy RNN-T decode
      const text = await decodeRNNT(encoded)
      return text
    } catch (e) {
      console.error('[Transcription] Inference failed:', e)
      throw e
    }
  }

  async function audioToMelSpectrogram(audioFile: File): Promise<{ mel: Float32Array; length: number }> {
    const arrayBuffer = await audioFile.arrayBuffer()
    
    // Decode audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    let audioData = audioBuffer.getChannelData(0) // mono
    const sampleRate = audioBuffer.sampleRate
    
    // Resample to 16kHz if needed
    let processedData: Float32Array = audioData
    if (sampleRate !== 16000) {
      processedData = resample(audioData, sampleRate, 16000)
    }

    // Compute mel spectrogram
    const windowSize = Math.floor(0.025 * 16000) // 400 samples = 25ms
    const hopLength = Math.floor(0.01 * 16000)   // 160 samples = 10ms
    const nMels = 128
    const mel = computeMelSpectrogram(processedData, windowSize, hopLength, nMels, 16000)
    
    return { mel, length: Math.floor(mel.length / nMels) }
  }

  function resample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate
    const newLength = Math.floor(data.length / ratio)
    const result = new Float32Array(newLength)
    
    for (let i = 0; i < newLength; i++) {
      const srcIdx = i * ratio
      const idx = Math.floor(srcIdx)
      const frac = srcIdx - idx
      const val1 = data[idx] ?? 0
      const val2 = idx + 1 < data.length ? data[idx + 1] ?? 0 : 0
      result[i] = val1 * (1 - frac) + val2 * frac
    }
    return result
  }

  function computeMelSpectrogram(
    audio: Float32Array,
    windowSize: number,
    hopLength: number,
    nMels: number,
    sampleRate: number
  ): Float32Array {
    const numFrames = Math.floor((audio.length - windowSize) / hopLength) + 1
    const mel = new Float32Array(numFrames * nMels)
    
    // Hanning window
    const window = new Float32Array(windowSize)
    for (let i = 0; i < windowSize; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (windowSize - 1)))
    }
    
    // Create filterbank
    const fftSize = 512
    const melFilters = createMelFilterbank(nMels, 0, sampleRate / 2, sampleRate, fftSize)

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopLength
      const frameData = new Float32Array(windowSize)
      
      // Apply window
      for (let i = 0; i < windowSize; i++) {
        const audioVal = audio[start + i]
        frameData[i] = (audioVal ?? 0) * (window[i] ?? 0)
      }
      
      // DFT (simplified)
      const magnitudes = new Float32Array(fftSize / 2)
      
      for (let k = 0; k < fftSize / 2; k++) {
        let re = 0, im = 0
        for (let n = 0; n < windowSize; n++) {
          const angle = 2 * Math.PI * k * n / fftSize
          re += (frameData[n] ?? 0) * Math.cos(angle)
          im += (frameData[n] ?? 0) * Math.sin(angle)
        }
        magnitudes[k] = Math.sqrt(re * re + im * im) + 1e-8
      }
      
      // Apply mel filterbank
      for (let m = 0; m < nMels; m++) {
        let sum = 0
        for (let bin = 0; bin < magnitudes.length; bin++) {
          sum += (magnitudes[bin] ?? 0) * (melFilters[m * (fftSize / 2) + bin] || 0)
        }
        // log mel spec with a very small constant
        // Fixed Mel spectrogram output layout: m * numFrames + frame
        mel[m * numFrames + frame] = Math.log(sum + 1e-5)
      }
    }
    
    // NeMo per_feature normalization
    // Normalizes each mel frequency bin across the time dimension
    for (let m = 0; m < nMels; m++) {
      let sum = 0
      for (let frame = 0; frame < numFrames; frame++) {
        sum += mel[m * numFrames + frame] ?? 0
      }
      const mean = sum / numFrames
      
      let sqSum = 0
      for (let frame = 0; frame < numFrames; frame++) {
        const val = mel[m * numFrames + frame] ?? 0
        sqSum += (val - mean) * (val - mean)
      }
      const std = Math.sqrt(sqSum / numFrames + 1e-5)
      
      for (let frame = 0; frame < numFrames; frame++) {
        mel[m * numFrames + frame] = ((mel[m * numFrames + frame] ?? 0) - mean) / std
      }
    }
    
    return mel
  }

  function createMelFilterbank(
    nMels: number,
    fMin: number,
    fMax: number,
    sampleRate: number,
    fftSize: number
  ): Float32Array {
    const filterbank = new Float32Array(nMels * fftSize / 2)
    const melMin = hzToMel(fMin)
    const melMax = hzToMel(fMax)
    const melStep = (melMax - melMin) / (nMels + 1)
    
    for (let m = 1; m <= nMels; m++) {
      const fLeft = melToHz(melMin + (m - 1) * melStep)
      const fCenter = melToHz(melMin + m * melStep)
      const fRight = melToHz(melMin + (m + 1) * melStep)
      
      const binLeft = Math.floor(fLeft * fftSize / sampleRate)
      const binCenter = Math.floor(fCenter * fftSize / sampleRate)
      const binRight = Math.floor(fRight * fftSize / sampleRate)
      
      for (let bin = binLeft; bin < binCenter; bin++) {
        if (bin < fftSize / 2) {
          filterbank[(m - 1) * (fftSize / 2) + bin] = (bin - binLeft) / (binCenter - binLeft)
        }
      }
      for (let bin = binCenter; bin < binRight; bin++) {
        if (bin < fftSize / 2) {
          filterbank[(m - 1) * (fftSize / 2) + bin] = (binRight - bin) / (binRight - binCenter)
        }
      }
    }
    
    return filterbank
  }

  function hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700)
  }

  function melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1)
  }

  async function decodeRNNT(encoded: ort.Tensor): Promise<string> {
    if (!decoderSession || vocab.size === 0) return '[Decoder/Vocab not loaded]'
    
    console.log('[Transcription] Decoding TDT...')
    
    const data = encoded.data as Float32Array
    const dims = encoded.dims
    const d_model = dims[1] as number // 1024
    const timeSteps = dims[2] as number // e.g., 194
    
    // Parakeet TDT configuration:
    // Vocab size: 8192 (indices 0 to 8191)
    // Blank ID: 8192
    // Duration logits: indices 8193 to 8197 (5 durations: 0, 1, 2, 3, 4)
    const BLANK_ID = 8192
    
    const transcript: number[] = []
    
    // Initialize RNN states: shape [2, 1, 640]
    let state1 = new Float32Array(2 * 1 * 640)
    let state2 = new Float32Array(2 * 1 * 640)
    
    // Initial target is usually blank
    let currentTarget = new Int32Array([BLANK_ID])
    
    let t = 0
    let safetyCounter = 0
    const MAX_ITERS = timeSteps * 5
    
    while (t < timeSteps && safetyCounter < MAX_ITERS) {
      safetyCounter++
      
      const frameData = new Float32Array(d_model)
      for (let c = 0; c < d_model; c++) {
        frameData[c] = data[c * timeSteps + t] ?? 0
      }
      
      const encoderOutT = new ort.Tensor('float32', frameData, [1, d_model, 1])
      
      const targetTensor = new ort.Tensor('int32', currentTarget, [1, 1])
      const targetLenTensor = new ort.Tensor('int32', new Int32Array([1]), [1])
      const state1Tensor = new ort.Tensor('float32', state1, [2, 1, 640])
      const state2Tensor = new ort.Tensor('float32', state2, [2, 1, 640])
      
      const outputs = await decoderSession.run({
        "encoder_outputs": encoderOutT,
        "targets": targetTensor,
        "target_length": targetLenTensor,
        "input_states_1": state1Tensor,
        "input_states_2": state2Tensor
      })
      
      const logitsData = outputs["outputs"]?.data
      if (!logitsData) break
      const logits = logitsData as unknown as Float32Array
      
      // Argmax for token (indices 0 to 8192)
      let maxTokenVal = -Infinity
      let predictedId = BLANK_ID
      for (let i = 0; i <= 8192; i++) {
        if ((logits[i] ?? -Infinity) > maxTokenVal) {
          maxTokenVal = logits[i] ?? -Infinity
          predictedId = i
        }
      }
      
      // Argmax for duration (indices 8193 to 8197)
      let maxDurVal = -Infinity
      let duration = 0
      for (let i = 8193; i < 8198; i++) {
        if ((logits[i] ?? -Infinity) > maxDurVal) {
          maxDurVal = logits[i] ?? -Infinity
          duration = i - 8193
        }
      }
      
      // Process token emission
      if (predictedId !== BLANK_ID) {
        transcript.push(predictedId)
        currentTarget[0] = predictedId
        
        const s1Data = outputs["output_states_1"]?.data
        const s2Data = outputs["output_states_2"]?.data
        
        if (s1Data && s2Data) {
          state1 = new Float32Array(s1Data as unknown as Float32Array)
          state2 = new Float32Array(s2Data as unknown as Float32Array)
        }
      }
      
      // Advance time step based on predicted duration
      if (duration > 0) {
        t += duration
      } else {
        // duration == 0 implies multiple tokens for this frame
        // Force advance if blank is emitted with duration 0 to prevent infinite loop
        if (predictedId === BLANK_ID) {
          t += 1
        }
      }
    }
    
    const text = transcript.map(id => vocab.get(id) || '').join('').replace(/▁/g, ' ').trim()
    console.log('[Transcription] Raw IDs:', transcript)
    console.log('[Transcription] Mapped text:', text)
    console.log('[Transcription] Decoding complete.')
    return text
  }

  async function transcribeWithOMLX(audioFile: File): Promise<string> {
    const duration = await getAudioDuration(audioFile)
    console.log(`[Transcription] Processing ${Math.round(duration)}s audio with OMLX...`)
    
    try {
      const config = {
        url: `http://127.0.0.1:${OMLX_PORT}/v1`,
        apiKey: OMLX_API_KEY
      }
      const transcriptUrl = config.url.replace('/v1', '/v1/audio/transcriptions')
      
      const formData = new FormData()
      formData.append('file', audioFile, 'audio.wav')
      formData.append('model', PARAKEEET_MODEL)
      formData.append('language', 'cs')
      formData.append('response_format', 'json')
      
      console.log('[Transcription] OMLX Transcription Attempt', { url: transcriptUrl, model: PARAKEEET_MODEL })
      
      const response = await fetch(import.meta.env.PROD ? transcriptUrl : '/omlx/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OMLX request failed: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('[Transcription] OMLX result:', result)
      return result.text || '[No transcription returned]'
    } catch (e: any) {
      console.error('[Transcription] OMLX transcription failed:', e)
      throw new Error(`OMLX transcription failed: ${e.message}`)
    }
  }

  async function transcribeFile(file: File): Promise<{ text: string; duration: number }> {
    const duration = await getAudioDuration(file)
    const text = await transcribeAudio(file)
    return { text, duration }
  }

  function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src)
        resolve(audio.duration)
      }
      audio.onerror = () => resolve(0)
    })
  }

  function toggleTranscriptionMode() {
    useLocalModel.value = !useLocalModel.value
    console.log(`[Transcription] Mode switched to: ${useLocalModel.value ? 'WebGPU (Local)' : 'OMLX (Server)'}`)
  }

  return {
    isLoading,
    isReady,
    downloadProgress,
    error,
    isWebGPU,
    useLocalModel,
    toggleTranscriptionMode,
    loadModel,
    transcribeFile
  }
}
