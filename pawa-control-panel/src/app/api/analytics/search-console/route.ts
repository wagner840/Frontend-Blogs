import { NextRequest, NextResponse } from 'next/server'
import { 
  getKeywordsByBlog
} from '@/lib/google-search-console/queries'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (2 hours for Search Console data)
const CACHE_DURATION = 7200

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get parameters
    const blog = searchParams.get('blog') as 'optemil' | 'einsof7' | 'all' | null
    const period = searchParams.get('period') || '28d'
    const includeBreakdowns = searchParams.get('breakdowns') !== 'false'
    
    // Validate blog parameter
    if (!blog || !['optemil', 'einsof7', 'all'].includes(blog)) {
      return NextResponse.json(
        { error: `Invalid blog parameter: ${blog}. Must be 'optemil', 'einsof7', or 'all'` },
        { status: 400 }
      )
    }

    // Convert period to date range
    const dateRange = convertPeriodToDateRange(period)
    
    try {
      console.log(`🔍 Fetching Search Console data for ${blog} (${period})...`)
      
      let searchConsoleData

      if (blog === 'all') {
        // Get combined data for all blogs
        const [optemilData, einsof7Data] = await Promise.all([
          fetchBlogSearchConsoleData('optemil', dateRange, includeBreakdowns),
          fetchBlogSearchConsoleData('einsof7', dateRange, includeBreakdowns)
        ])

        searchConsoleData = {
          blog: 'all',
          name: 'Todos os Blogs',
          period,
          dateRange,
          summary: {
            totalClicks: optemilData.summary.totalClicks + einsof7Data.summary.totalClicks,
            totalImpressions: optemilData.summary.totalImpressions + einsof7Data.summary.totalImpressions,
            averageCTR: calculateWeightedCTR([optemilData.summary, einsof7Data.summary]),
            averagePosition: calculateWeightedPosition([optemilData.summary, einsof7Data.summary]),
            blogs: [
              {
                id: 'optemil',
                name: 'Optemil',
                ...optemilData.summary
              },
              {
                id: 'einsof7',
                name: 'Einsof7',
                ...einsof7Data.summary
              }
            ]
          },
          topKeywords: combineAndSortKeywords([optemilData.topKeywords, einsof7Data.topKeywords]),
          topPages: combineAndSortPages([optemilData.topPages, einsof7Data.topPages]),
          ...(includeBreakdowns && {
            deviceBreakdown: combineBreakdowns([optemilData.deviceBreakdown, einsof7Data.deviceBreakdown]),
            countryBreakdown: combineBreakdowns([optemilData.countryBreakdown, einsof7Data.countryBreakdown])
          })
        }
      } else {
        // Get data for specific blog
        const blogData = await fetchBlogSearchConsoleData(blog, dateRange, includeBreakdowns)
        
        searchConsoleData = {
          blog,
          name: blog === 'optemil' ? 'Optemil' : 'Einsof7',
          period,
          dateRange,
          ...blogData
        }
      }

      const response = NextResponse.json({
        success: true,
        data: searchConsoleData,
        cached: false,
        timestamp: new Date().toISOString(),
        meta: {
          dataFreshness: 'Real-time from Google Search Console API',
          disclaimer: 'Search Console data may have 2-3 days delay'
        }
      })

      // Set cache headers
      response.headers.set('Cache-Control', `s-maxage=${CACHE_DURATION}, stale-while-revalidate`)
      
      return response

    } catch (searchConsoleError) {
      console.error('Search Console API Error:', searchConsoleError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Search Console data',
        message: 'Unable to retrieve data from Google Search Console. Please try again later.',
        fallback: false,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Search Console API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Helper function to fetch data for a specific blog
async function fetchBlogSearchConsoleData(
  blog: 'optemil' | 'einsof7',
  dateRange: DateRange,
  includeBreakdowns: boolean
) {
  // For now, only fetch keywords as other functions need debugging
  const topKeywords = await getKeywordsByBlog(blog, dateRange, 20)

  // Calculate summary metrics from keywords
  const summary = {
    totalClicks: topKeywords.reduce((sum: number, k: any) => sum + k.clicks, 0),
    totalImpressions: topKeywords.reduce((sum: number, k: any) => sum + k.impressions, 0),
    averageCTR: topKeywords.length > 0 
      ? Math.round((topKeywords.reduce((sum: number, k: any) => sum + k.ctr, 0) / topKeywords.length) * 100) / 100
      : 0,
    averagePosition: topKeywords.length > 0
      ? Math.round((topKeywords.reduce((sum: number, k: any) => sum + k.position, 0) / topKeywords.length) * 10) / 10
      : 0
  }

  return {
    summary,
    topKeywords,
    topPages: [], // Will be implemented in next phase
    ...(includeBreakdowns && {
      deviceBreakdown: [], // Will be implemented in next phase
      countryBreakdown: [] // Will be implemented in next phase
    })
  }
}

// Helper function to convert period string to date range
function convertPeriodToDateRange(period: string): DateRange {
  switch (period) {
    case '7d':
      return { startDate: '7daysAgo', endDate: 'yesterday' }
    case '28d':
      return { startDate: '28daysAgo', endDate: 'yesterday' }
    case '90d':
      return { startDate: '90daysAgo', endDate: 'yesterday' }
    case '6m':
      return { startDate: '180daysAgo', endDate: 'yesterday' }
    case '1y':
      return { startDate: '365daysAgo', endDate: 'yesterday' }
    default:
      return { startDate: '28daysAgo', endDate: 'yesterday' }
  }
}

// Helper functions for combining data
function calculateWeightedCTR(summaries: any[]) {
  const totalClicks = summaries.reduce((sum, s) => sum + s.totalClicks, 0)
  const totalImpressions = summaries.reduce((sum, s) => sum + s.totalImpressions, 0)
  return totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
}

function calculateWeightedPosition(summaries: any[]) {
  const totalImpressions = summaries.reduce((sum, s) => sum + s.totalImpressions, 0)
  if (totalImpressions === 0) return 0
  
  const weightedSum = summaries.reduce((sum, s) => sum + (s.averagePosition * s.totalImpressions), 0)
  return Math.round((weightedSum / totalImpressions) * 10) / 10
}

function combineAndSortKeywords(keywordSets: any[]) {
  const combined = keywordSets.flat()
  const keywordMap = new Map()

  combined.forEach(keyword => {
    const key = keyword.query
    if (keywordMap.has(key)) {
      const existing = keywordMap.get(key)
      existing.clicks += keyword.clicks
      existing.impressions += keyword.impressions
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
      existing.position = (existing.position + keyword.position) / 2
    } else {
      keywordMap.set(key, { ...keyword })
    }
  })

  return Array.from(keywordMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
}

function combineAndSortPages(pageSets: any[]) {
  const combined = pageSets.flat()
  const pageMap = new Map()

  combined.forEach(page => {
    const key = page.page
    if (pageMap.has(key)) {
      const existing = pageMap.get(key)
      existing.clicks += page.clicks
      existing.impressions += page.impressions
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
      existing.position = (existing.position + page.position) / 2
    } else {
      pageMap.set(key, { ...page })
    }
  })

  return Array.from(pageMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15)
}

function combineBreakdowns(breakdownSets: any[]) {
  const combined = breakdownSets.flat()
  const breakdownMap = new Map()

  combined.forEach(item => {
    const key = item.device || item.country
    if (breakdownMap.has(key)) {
      const existing = breakdownMap.get(key)
      existing.clicks += item.clicks
      existing.impressions += item.impressions
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
      existing.position = (existing.position + item.position) / 2
    } else {
      breakdownMap.set(key, { ...item })
    }
  })

  return Array.from(breakdownMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
}