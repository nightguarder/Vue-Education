/**
 * Centralized Service for OMLX API Interactions
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | any[]
}

export interface OmlxOptions {
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  stop?: string[]
}

const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemma-4-e4b-it-OptiQ-4bit'
const API_KEY = import.meta.env.VITE_OMLX_API_KEY || '5004'

export async function fetchChatCompletion(
  messages: ChatMessage[],
  options: OmlxOptions = {}
): Promise<string> {
  const response = await fetch('/omlx/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature ?? 0.7,
      stop: options.stop || ['<end_of_turn>'],
      stream: false,
    }),
  })

  if (!response.ok) throw new Error(`OMLX API failed: ${response.statusText}`)
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const result = content.split('<end_of_turn>')[0]
  return (result || '').trim()
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  onDelta: (content: string) => void,
  options: OmlxOptions = {}
): Promise<string> {
  const response = await fetch('/omlx/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature ?? 0.7,
      stop: options.stop || ['<end_of_turn>'],
      stream: true,
    }),
  })

  if (!response.ok) throw new Error(`OMLX Stream failed: ${response.statusText}`)

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  if (!reader) throw new Error('Response body has no reader')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim()
        if (dataStr === '[DONE]') break

        try {
          const data = JSON.parse(dataStr)
          const delta = data.choices?.[0]?.delta?.content || ''
          fullContent += delta
          onDelta(delta)
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }

  return fullContent.trim()
}
