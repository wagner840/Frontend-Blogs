import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { 
  getKeywordsByBlog
} from '@/lib/google-search-console/queries'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (2 hours for Search Console data)
const CACHE_DURATION = 7200

// Type definitions
interface KeywordData {
  clicks: number
  impressions: number
  ctr: number
  position: number
  query?: string
  term?: string
}

interface SummaryData {
  totalClicks: number
  totalImpressions: number
  averageCTR: number
  averagePosition: number
}

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
            totalClicks: (optemilData.summary as unknown as SummaryData).totalClicks + (einsof7Data.summary as unknown as SummaryData).totalClicks,
            totalImpressions: (optemilData.summary as unknown as SummaryData).totalImpressions + (einsof7Data.summary as unknown as SummaryData).totalImpressions,
            averageCTR: calculateWeightedCTR([optemilData.summary as unknown as SummaryData, einsof7Data.summary as unknown as SummaryData]),
            averagePosition: calculateWeightedPosition([optemilData.summary as unknown as SummaryData, einsof7Data.summary as unknown as SummaryData]),
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
          topKeywords: combineAndSortKeywords([optemilData.topKeywords as unknown as KeywordData[], einsof7Data.topKeywords as unknown as KeywordData[]]),
          topPages: combineAndSortPages([optemilData.topPages, einsof7Data.topPages]),
          ...(includeBreakdowns && {
            deviceBreakdown: combineBreakdowns([optemilData.deviceBreakdown || [], einsof7Data.deviceBreakdown || []]),
            countryBreakdown: combineBreakdowns([optemilData.countryBreakdown || [], einsof7Data.countryBreakdown || []])
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
  const keywordsData = topKeywords as unknown as KeywordData[]
  const summary = {
    totalClicks: keywordsData.reduce((sum: number, k: KeywordData) => sum + k.clicks, 0),
    totalImpressions: keywordsData.reduce((sum: number, k: KeywordData) => sum + k.impressions, 0),
    averageCTR: keywordsData.length > 0 
      ? Math.round((keywordsData.reduce((sum: number, k: KeywordData) => sum + k.ctr, 0) / keywordsData.length) * 100) / 100
      : 0,
    averagePosition: keywordsData.length > 0
      ? Math.round((keywordsData.reduce((sum: number, k: KeywordData) => sum + k.position, 0) / keywordsData.length) * 10) / 10
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
function calculateWeightedCTR(summaries: SummaryData[]) {
  const totalClicks = summaries.reduce((sum, s) => sum + s.totalClicks, 0)
  const totalImpressions = summaries.reduce((sum, s) => sum + s.totalImpressions, 0)
  return totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
}

function calculateWeightedPosition(summaries: SummaryData[]) {
  const totalImpressions = summaries.reduce((sum, s) => sum + s.totalImpressions, 0)
  if (totalImpressions === 0) return 0
  
  const weightedSum = summaries.reduce((sum, s) => sum + (s.averagePosition * s.totalImpressions), 0)
  return Math.round((weightedSum / totalImpressions) * 10) / 10
}

function combineAndSortKeywords(keywordSets: KeywordData[][]) {
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

function combineAndSortPages(pageSets: unknown[][]) {
  const combined = pageSets.flat()
  const pageMap = new Map()

  combined.forEach(page => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = page as any
    const key = p.page
    if (pageMap.has(key)) {
      const existing = pageMap.get(key)
      existing.clicks += p.clicks
      existing.impressions += p.impressions
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
      existing.position = (existing.position + p.position) / 2
    } else {
      pageMap.set(key, { ...p })
    }
  })

  return Array.from(pageMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15)
}

function combineBreakdowns(breakdownSets: unknown[][]) {
  const combined = breakdownSets.flat()
  const breakdownMap = new Map()

  combined.forEach(item => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const i = item as any
    const key = i.device || i.country
    if (breakdownMap.has(key)) {
      const existing = breakdownMap.get(key)
      existing.clicks += i.clicks
      existing.impressions += i.impressions
      existing.ctr = existing.impressions > 0 ? (existing.clicks / existing.impressions) * 100 : 0
      existing.position = (existing.position + i.position) / 2
    } else {
      breakdownMap.set(key, { ...i })
    }
  })

  return Array.from(breakdownMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
}