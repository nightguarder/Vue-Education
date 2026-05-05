import { UniversalTTSSession } from "onnx-tts-web"
import * as ort from "onnxruntime-web/webgpu"

// Enable debug for WebGPU
ort.env.debug = true
ort.env.logLevel = 'verbose'

const ASSETS_CDN = "https://nightguarder.github.io/Wasm-assets/"
const ONNX_VERSION = "1.26.0-dev.20260410-5e55544225"
const ONNX_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_VERSION}/dist/`

let ttsSession: UniversalTTSSession | null = null

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data

  if (type === "init") {
    const { voiceId } = payload

    try {
      console.log('[TTS Worker] Initializing with voice:', voiceId)

      ttsSession = new UniversalTTSSession({
        modelId: voiceId,
        engineType: "piper",
        modelSource: {
          type: "url",
          baseUrl: `${ASSETS_CDN}voices/${voiceId}`
        },
        wasmPaths: {
          onnxWasm: ONNX_CDN,
          piperData: `${ASSETS_CDN}wasm/piper_phonemize.data`,
          piperWasm: `${ASSETS_CDN}wasm/piper_phonemize.wasm`
        },
        logger: console.log
      })

      await ttsSession.init()
      console.log('[TTS Worker] Initialized successfully')
      self.postMessage({ type: "init_done", id })
    } catch (error) {
      self.postMessage({
        type: "error",
        id,
        error: `TTS init failed: ${error instanceof Error ? error.message : String(error)}`
      })
      self.close()
    }
    return
  }

  if (type === "synthesize") {
    if (!ttsSession) {
      self.postMessage({ type: "error", id, error: "TTS not initialized" })
      return
    }

    const { text } = payload

    try {
      const cleanText = text.replace(/\n/g, " ").trim()
      if (!cleanText) {
        self.postMessage({ type: "synthesize_done", id })
        return
      }

      console.log('[TTS Worker] Synthesizing:', cleanText.substring(0, 50) + '...')
      const audioBlob = await ttsSession.predict(cleanText)
      const buffer = await audioBlob.arrayBuffer()

      ;(self as any).postMessage(
        { type: "audio_ready", id, buffer },
        [buffer]
      )
    } catch (error) {
      self.postMessage({
        type: "error",
        id,
        error: `TTS synthesis failed: ${error instanceof Error ? error.message : String(error)}`
      })
    }
    return
  }

  if (type === "terminate") {
    if (ttsSession) {
      ttsSession.dispose()
      ttsSession = null
    }
    self.postMessage({ type: "terminate_done", id })
    self.close()
  }
}
