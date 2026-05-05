// PubMed API Service using NCBI E-Utilities
// No API key required for basic use

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export interface PubMedArticle {
  pmid: string
  title: string
  authors: { name: string; affiliation?: string }[]
  journal?: string
  pubDate?: string
  abstract?: string
}

export interface PubMedSearchResult {
  articles: PubMedArticle[]
  totalCount: number
  hasMore: boolean
}

async function searchPubMedIds(
  query: string,
  page: number = 1,
  perPage: number = 10,
): Promise<{ ids: string[]; total: number }> {
  const response = await fetch(
    `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${perPage}&retstart=${(page - 1) * perPage}&retmode=json&sort=relevance`,
  )

  if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)

  const data = await response.json()
  const ids = data.esearchresult?.idlist || []
  const total = parseInt(data.esearchresult?.count || '0', 10)

  return { ids, total }
}

async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return []

  const response = await fetch(
    `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`,
  )

  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`)

  const xmlText = await response.text()
  return parsePubMedXML(xmlText)
}

function parsePubMedXML(xmlText: string): PubMedArticle[] {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
  const articles: PubMedArticle[] = []

  const articleNodes = xmlDoc.getElementsByTagName('PubmedArticle')

  for (let i = 0; i < articleNodes.length; i++) {
    const node = articleNodes[i]
    if (!node) continue

    const pmid = node.querySelector('PMID')?.textContent || ''
    const title = node.querySelector('ArticleTitle')?.textContent || 'Untitled'
    const abstract = node.querySelector('AbstractText')?.textContent || ''

    // Parse authors
    const authorNodes = node.querySelectorAll('Author')
    const authors: { name: string; affiliation?: string }[] = []
    authorNodes.forEach((author) => {
      const lastName = author.querySelector('LastName')?.textContent || ''
      const foreName = author.querySelector('ForeName')?.textContent || ''
      const name = foreName && lastName ? `${foreName} ${lastName}` : lastName || 'Unknown'
      authors.push({ name })
    })

    // Journal info
    const journal = node.querySelector('Journal Title')?.textContent || ''
    const year = node.querySelector('PubDate Year')?.textContent || ''
    const month = node.querySelector('PubDate Month')?.textContent || ''
    const pubDate = year ? (month ? `${month} ${year}` : year) : ''

    articles.push({ pmid, title, authors, journal, pubDate, abstract })
  }

  return articles
}

// Main search function - two-step process
export async function searchMedicalLiterature(
  query: string,
  page: number = 1,
  perPage: number = 10,
): Promise<PubMedSearchResult> {
  const { ids, total } = await searchPubMedIds(query, page, perPage)

  if (ids.length === 0) {
    return { articles: [], totalCount: 0, hasMore: false }
  }

  const articles = await fetchArticleDetails(ids)
  const hasMore = page * perPage < total

  return { articles, totalCount: total, hasMore }
}

// Helper to format authors
export function formatAuthors(authors: { name: string }[]): string {
  if (!authors?.length) return 'No authors'
  if (authors.length <= 3) return authors.map((a) => a.name).join(', ')
  return `${authors[0]?.name || 'Unknown'} et al.`
}

// Helper to truncate abstract
export function truncateAbstract(text: string, maxLength: number = 300): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
