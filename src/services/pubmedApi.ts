// PubMed API Service using NCBI E-Utilities
// No API key required for basic use

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export interface PubMedFigure {
  id: string
  label: string
  caption: string
  url: string
}

export interface PubMedArticle {
  pmid: string
  pmc?: string
  title: string
  authors: { name: string; affiliation?: string }[]
  journal?: string
  pubDate?: string
  abstract?: string
  isOpenAccess: boolean
  figures?: PubMedFigure[]
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
    const pmc = Array.from(node.querySelectorAll('ArticleId')).find(el => el.getAttribute('IdType') === 'pmc')?.textContent || ''
    const title = node.querySelector('ArticleTitle')?.textContent || 'Untitled'
    const abstract = node.querySelector('AbstractText')?.textContent || ''
    const isOpenAccess = !!pmc

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

    articles.push({ pmid, pmc, title, authors, journal, pubDate, abstract, isOpenAccess })
  }

  return articles
}

// Fetch figures for a PMC article with enhanced scraping
export async function fetchArticleFigures(pmcid: string): Promise<PubMedFigure[]> {
  if (!pmcid) return []
  
  const cleanPmcId = pmcid.startsWith('PMC') ? pmcid : `PMC${pmcid}`
  const id = cleanPmcId.replace('PMC', '')
  const figures: PubMedFigure[] = []
  
  try {
    // Strategy 1: Try XML first for metadata
    const xmlResponse = await fetch(
      `${PUBMED_BASE}/efetch.fcgi?db=pmc&id=${id}&retmode=xml`
    )
    
    if (xmlResponse.ok) {
      const xmlText = await xmlResponse.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const figNodes = xmlDoc.getElementsByTagName('fig')
      
      Array.from(figNodes).forEach((node, i) => {
        const figId = node.getAttribute('id') || `fig${i}`
        const label = node.querySelector('label')?.textContent || `Figure ${i + 1}`
        const caption = node.querySelector('caption')?.textContent?.trim() || ''
        const graphic = node.querySelector('graphic')
        const href = graphic?.getAttribute('xlink:href') || graphic?.getAttribute('href')
        
        if (href) {
          // Use Proxied CDN for XML images too
          const fileName = href.includes('.') ? href : `${href}.jpg`
          const url = `/pmc-cdn/pmc/articles/${cleanPmcId}/bin/${fileName}`
          figures.push({ id: figId, label, caption, url })
        }
      })
    }

    // Strategy 2: HTML Scraping via Proxy
    if (figures.length === 0) {
      console.log(`[PubMed] XML yielded no figures for ${cleanPmcId}, attempting proxied HTML scrape...`)
      
      try {
        const htmlResponse = await fetch(`/pmc/${cleanPmcId}/`)
        if (htmlResponse.ok) {
          const htmlText = await htmlResponse.text()
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlText, 'text/html')
          
          // Target both legacy and modernized figure containers
          const figureNodes = doc.querySelectorAll('figure.figure, figure.figure-item, .figure-item')
          console.log(`[PubMed] Scraper found ${figureNodes.length} figure nodes in HTML`)

          figureNodes.forEach((node, idx) => {
            // Selectors for modernized and legacy layouts
            const img = node.querySelector('img.figure-image, img.figure-thumb, img')
            const link = node.querySelector('a.figure-link, a[target="_blank"]')
            
            const label = node.querySelector('.figure-label, .label')?.textContent?.trim() || 
                          `Figure ${idx + 1}`
            
            const caption = node.querySelector('.figure-caption, .figure-caption-contents, figcaption')?.textContent?.trim() || ''
            
            // Construct the best possible image URL
            let rawUrl = img?.getAttribute('src') || link?.getAttribute('href') || ''
            
            if (rawUrl) {
              // Ignore standard UI icons or spacers
              if (rawUrl.includes('spacer') || rawUrl.includes('icon-')) return

              let finalUrl = ''
              
              // Handle modernized paths: /articles/PMC.../bin/...
              // Or legacy paths: /pmc/articles/PMC.../bin/...
              if (rawUrl.startsWith('http')) {
                 const urlObj = new URL(rawUrl)
                 finalUrl = `/pmc-cdn${urlObj.pathname}`
              } else {
                 // Ensure we have a valid path to the binary image
                 if (!rawUrl.includes('/bin/') && !rawUrl.endsWith('.jpg') && !rawUrl.endsWith('.png')) {
                    // It might be a link to a figure subpage, try to find a better one
                    return
                 }
                 
                 if (rawUrl.startsWith('/')) {
                    finalUrl = `/pmc-cdn${rawUrl}`
                 } else {
                    finalUrl = `/pmc-cdn/pmc/articles/${cleanPmcId}/${rawUrl}`
                 }
              }

              if (finalUrl && !figures.find(f => f.url === finalUrl)) {
                figures.push({
                  id: node.getAttribute('id') || node.getAttribute('data-figure-id') || `scrape-${idx}`,
                  label,
                  caption: caption.replace(label, '').replace(/[\n\r]+/g, ' ').trim(), // Clean up redundant label in caption
                  url: finalUrl
                })
              }
            }
          })
        }
      } catch (scrapeErr) {
        console.warn('[PubMed] HTML Scrape failed:', scrapeErr)
      }
    }
    
    return figures
  } catch (err) {
    console.error('[PubMed] Error fetching figures:', err)
    return figures // Return whatever we found
  }
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
