import { getGA4Client } from '../ga4-client'
import { TopPage, DateRange } from '../types'
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
function getBlogFromPropertyId(propertyId: string): string {
  if (propertyId === getPropertyId('optemil')) return 'Optemil'
  if (propertyId === getPropertyId('einsof7')) return 'Einsof7'
  return 'Unknown'
}

// Get top pages for GA4 property
export async function getGA4TopPages(
  propertyId: string,
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' },
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    const client = await getGA4Client().getClient()
    
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      ],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
      ],
      metrics: [
        { name: 'screenPageViews' },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews',
          },
          desc: true,
        },
      ],
      limit: maxResults,
    })

    if (!response.rows) {
      return []
    }

    const blog = getBlogFromPropertyId(propertyId)
    
    return response.rows.map((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || '/'
      const pageTitle = row.dimensionValues?.[1]?.value || extractTitle(pagePath)
      const pageViews = parseInt(row.metricValues?.[0]?.value || '0')

      return {
        title: pageTitle,
        slug: pagePath,
        views: pageViews,
        blog: blog
      }
    }).filter(page => page.views > 0) // Filter out pages with 0 views

  } catch (error) {
    console.error(`Error fetching GA4 top pages for propertyId ${propertyId}:`, error)
    return []
  }
}

// Get combined top pages from multiple properties
export async function getCombinedGA4TopPages(
  propertyIds: string[],
  dateRange?: DateRange,
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    const allPages = await Promise.all(
      propertyIds.map(propertyId => getGA4TopPages(propertyId, dateRange, maxResults * 2)) // Get more to ensure we have enough after combining
    )

    // Flatten and sort by views
    const combinedPages = allPages
      .flat()
      .sort((a, b) => b.views - a.views)
      .slice(0, maxResults)

    return combinedPages

  } catch (error) {
    console.error('Error fetching combined GA4 top pages:', error)
    return []
  }
}

// Get top pages by specific blog
export async function getGA4TopPagesByBlog(
  blog: 'optemil' | 'einsof7' | 'all',
  dateRange?: DateRange,
  maxResults: number = 10
): Promise<TopPage[]> {
  try {
    switch (blog) {
      case 'optemil':
        return getGA4TopPages(getPropertyId('optemil'), dateRange, maxResults)
      
      case 'einsof7':
        return getGA4TopPages(getPropertyId('einsof7'), dateRange, maxResults)
      
      case 'all':
        return getCombinedGA4TopPages([
          getPropertyId('optemil'),
          getPropertyId('einsof7')
        ], dateRange, maxResults)
      
      default:
        return []
    }
  } catch (error) {
    console.error(`Error fetching GA4 top pages for blog ${blog}:`, error)
    return []
  }
}