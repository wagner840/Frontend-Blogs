import { getGAClient } from '../client'
import { GAReportRequest, GAReportResponse, TopPage, DateRange } from '../types'
import { getPropertyId } from '../config'

// Helper to extract meaningful title from page path
function extractTitle(pagePath: string): string {
  // Remove leading slash and convert dashes/underscores to spaces
  let title = pagePath.replace(/^\//, '').replace(/[-_]/g, ' ')
  
  // Capitalize first letter of each word
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Handle common patterns
  if (title.includes('ozempic')) {
    return 'Ozempic: Como Funciona para Emagrecer'
  }
  if (title.includes('netflix')) {
    return 'Melhores Filmes Netflix 2024'
  }
  if (title.includes('calistenia')) {
    return 'Calistenia para Iniciantes'
  }
  if (title.includes('android') && title.includes('tv')) {
    return 'Android TV: Guia Completo'
  }
  if (title.includes('tdah')) {
    return 'TDAH: Guia Completo'
  }
  if (title.includes('chromecast')) {
    return 'Chromecast vs Fire TV Stick'
  }
  
  return title || 'Home Page'
}

// Helper to determine which blog a page belongs to
function getBlogFromViewId(viewId: string): string {
  if (viewId === getPropertyId('optemil')) return 'Optemil'
  if (viewId === getPropertyId('einsof7')) return 'Einsof7'
  return 'Unknown'
}

// Get top pages for a specific view ID (property)
export async function getTopPages(
  viewId: string,
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' },
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    const client = await getGAClient()
    const reporting = await client.getReportingClient()

    const request: GAReportRequest = {
      viewId,
      dateRanges: [dateRange],
      metrics: [
        { expression: 'ga:pageviews' },
        { expression: 'ga:uniquePageviews' }
      ],
      dimensions: [
        { name: 'ga:pagePath' },
        { name: 'ga:pageTitle' }
      ],
      orderBys: [
        {
          fieldName: 'ga:pageviews',
          sortOrder: 'DESCENDING'
        }
      ],
      pageSize: maxResults
    }

    const response = await reporting.reports.batchGet({
      requestBody: { reportRequests: [request] }
    })

    const data = response.data as GAReportResponse
    
    if (!data.reports?.[0]?.data?.rows) {
      return []
    }

    const blog = getBlogFromViewId(viewId)
    
    return data.reports[0].data.rows.map((row) => {
      const pagePath = row.dimensions?.[0] || '/'
      const pageTitle = row.dimensions?.[1] || extractTitle(pagePath)
      const pageViews = parseInt(row.metrics[0].values[0])

      return {
        title: pageTitle,
        slug: pagePath,
        views: pageViews,
        blog: blog
      }
    }).filter(page => page.views > 0) // Filter out pages with 0 views

  } catch (error) {
    console.error(`Error fetching top pages for viewId ${viewId}:`, error)
    return []
  }
}

// Get combined top pages from multiple view IDs
export async function getCombinedTopPages(
  viewIds: string[],
  dateRange?: DateRange,
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    const allPages = await Promise.all(
      viewIds.map(viewId => getTopPages(viewId, dateRange, maxResults * 2)) // Get more to ensure we have enough after combining
    )

    // Flatten and sort by views
    const combinedPages = allPages
      .flat()
      .sort((a, b) => b.views - a.views)
      .slice(0, maxResults)

    return combinedPages

  } catch (error) {
    console.error('Error fetching combined top pages:', error)
    return []
  }
}

// Get top pages by specific blog
export async function getTopPagesByBlog(
  blog: 'optemil' | 'einsof7' | 'all',
  dateRange?: DateRange,
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    switch (blog) {
      case 'optemil':
        return getTopPages(getPropertyId('optemil'), dateRange, maxResults)
      
      case 'einsof7':
        return getTopPages(getPropertyId('einsof7'), dateRange, maxResults)
      
      case 'all':
        return getCombinedTopPages([
          getPropertyId('optemil'),
          getPropertyId('einsof7')
        ], dateRange, maxResults)
      
      default:
        return []
    }
  } catch (error) {
    console.error(`Error fetching top pages for blog ${blog}:`, error)
    return []
  }
}