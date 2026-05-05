// Tavily REST API Service for web search
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || ''
const TAVILY_API_URL = 'https://api.tavily.com/search'

export interface TavilyResult {
  url: string
  title: string
  content: string
  score?: number
}

export async function searchWeb(query: string, maxResults: number = 5): Promise<TavilyResult[]> {
  if (!TAVILY_API_KEY) {
    throw new Error('Tavily API key not configured. Please add VITE_TAVILY_API_KEY to .env')
  }

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tavily API Error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Tavily Search Error:', error)
    throw error
  }
}

export function isTavilyConfigured(): boolean {
  return !!TAVILY_API_KEY && TAVILY_API_KEY.length > 10
}
