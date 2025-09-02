import { NextRequest, NextResponse } from 'next/server'
import { getDetailedTrafficBreakdown, getTrafficMediumBreakdown } from '@/lib/google-analytics/queries/ga4-traffic-detailed'
import { getContentPerformanceAnalysis } from '@/lib/google-analytics/queries/content-analysis'
import { getKeywordsByBlog } from '@/lib/google-search-console/queries'
import { getPropertyId, validateGAConfig } from '@/lib/google-analytics/config'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (30 minutes for unified data)
const CACHE_DURATION = 1800

export async function GET(request: NextRequest) {
  try {
    // Validate configuration first
    if (!validateGAConfig()) {
      return NextResponse.json(
        { 
          error: 'Google Analytics not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_KEY and property IDs in environment variables.',
          configured: false
        }, 
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Get parameters
    const blog = searchParams.get('blog') || 'all'
    const period = searchParams.get('period') || '7d'
    
    // Convert period to date range
    const dateRange = convertPeriodToDateRange(period)
    
    // Validate blog parameter
    if (!['optemil', 'einsof7', 'all'].includes(blog)) {
      return NextResponse.json(
        { error: `Invalid blog parameter: ${blog}. Must be 'optemil', 'einsof7', or 'all'` },
        { status: 400 }
      )
    }

    let unifiedData
    
    try {
      if (blog === 'all') {
        // Get combined data for all blogs
        const [optemilData, einsof7Data] = await Promise.all([
          fetchBlogData('optemil', dateRange),
          fetchBlogData('einsof7', dateRange)
        ])

        unifiedData = {
          blog: 'all',
          name: 'Todos os Blogs',
          period,
          dateRange,
          summary: {
            totalSessions: optemilData.trafficBreakdown.totalSessions + einsof7Data.trafficBreakdown.totalSessions,
            totalPageViews: optemilData.contentPerformance.totalPageViews + einsof7Data.contentPerformance.totalPageViews,
            blogs: [
              {
                id: 'optemil',
                name: 'Optemil',
                sessions: optemilData.trafficBreakdown.totalSessions,
                pageViews: optemilData.contentPerformance.totalPageViews
              },
              {
                id: 'einsof7',
                name: 'Einsof7', 
                sessions: einsof7Data.trafficBreakdown.totalSessions,
                pageViews: einsof7Data.contentPerformance.totalPageViews
              }
            ]
          },
          trafficBreakdown: combineTrafficBreakdowns([optemilData.trafficBreakdown, einsof7Data.trafficBreakdown]),
          contentPerformance: combineContentPerformance([optemilData.contentPerformance, einsof7Data.contentPerformance]),
          seoInsights: combineKeywords([optemilData.seoInsights, einsof7Data.seoInsights]),
          insights: [...optemilData.trafficBreakdown.insights, ...einsof7Data.trafficBreakdown.insights, ...optemilData.contentPerformance.insights, ...einsof7Data.contentPerformance.insights]
        }
      } else {
        // Get data for specific blog
        const blogData = await fetchBlogData(blog as 'optemil' | 'einsof7', dateRange)
        
        unifiedData = {
          blog,
          name: blog === 'optemil' ? 'Optemil' : 'Einsof7',
          period,
          dateRange,
          summary: {
            totalSessions: blogData.trafficBreakdown.totalSessions,
            totalPageViews: blogData.contentPerformance.totalPageViews
          },
          trafficBreakdown: blogData.trafficBreakdown,
          contentPerformance: blogData.contentPerformance,
          seoInsights: blogData.seoInsights,
          insights: [...blogData.trafficBreakdown.insights, ...blogData.contentPerformance.insights]
        }
      }

      const response = NextResponse.json({
        success: true,
        data: unifiedData,
        cached: false,
        timestamp: new Date().toISOString(),
        meta: {
          dataFreshness: 'Real-time from Google APIs',
          disclaimer: 'GA4 data may have 24-48h delay for some metrics'
        }
      })

      // Set cache headers
      response.headers.set('Cache-Control', `s-maxage=${CACHE_DURATION}, stale-while-revalidate`)
      
      return response

    } catch (analyticsError) {
      console.error('Blog Analytics API Error:', analyticsError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch analytics data',
        message: 'Unable to retrieve data from Google Analytics. Please try again later.',
        fallback: false,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Blog Analytics Unified API Error:', error)
    
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
async function fetchBlogData(blog: 'optemil' | 'einsof7', dateRange: DateRange) {
  const propertyId = getPropertyId(blog)
  
  const [trafficBreakdown, contentPerformance, seoInsights] = await Promise.all([
    getDetailedTrafficBreakdown(propertyId, dateRange),
    getContentPerformanceAnalysis(propertyId, dateRange, 15),
    getKeywordsByBlog(blog, dateRange, 10).catch(() => []) // Fallback if Search Console fails
  ])

  return {
    trafficBreakdown,
    contentPerformance,
    seoInsights
  }
}

// Helper function to convert period string to date range
function convertPeriodToDateRange(period: string): DateRange {
  switch (period) {
    case '7d':
      return { startDate: '7daysAgo', endDate: 'yesterday' }
    case '30d':
      return { startDate: '30daysAgo', endDate: 'yesterday' }
    case '90d':
      return { startDate: '90daysAgo', endDate: 'yesterday' }
    case '1y':
      return { startDate: '365daysAgo', endDate: 'yesterday' }
    default:
      return { startDate: '7daysAgo', endDate: 'yesterday' }
  }
}

// Helper function to combine traffic breakdowns
function combineTrafficBreakdowns(breakdowns: any[]) {
  const combined = {
    totalSessions: 0,
    breakdown: [] as any[],
    insights: [] as any[]
  }

  // Sum total sessions
  combined.totalSessions = breakdowns.reduce((sum, b) => sum + b.totalSessions, 0)

  // Combine breakdown data by medium
  const mediumMap = new Map()
  
  breakdowns.forEach(breakdown => {
    breakdown.breakdown.forEach((item: any) => {
      const key = `${item.medium}_${item.source}`
      if (mediumMap.has(key)) {
        const existing = mediumMap.get(key)
        existing.sessions += item.sessions
        existing.keyEvents += item.keyEvents
        // Recalculate weighted averages
        existing.bounceRate = (existing.bounceRate + item.bounceRate) / 2
        existing.engagementRate = (existing.engagementRate + item.engagementRate) / 2
      } else {
        mediumMap.set(key, { ...item })
      }
    })
  })

  combined.breakdown = Array.from(mediumMap.values())
  
  // Recalculate percentages
  combined.breakdown.forEach((item: any) => {
    item.percentageOfTotal = Math.round((item.sessions / combined.totalSessions) * 1000) / 10
  })

  // Combine insights
  combined.insights = breakdowns.flatMap(b => b.insights)

  return combined
}

// Helper function to combine content performance
function combineContentPerformance(performances: any[]) {
  return {
    totalPageViews: performances.reduce((sum, p) => sum + p.totalPageViews, 0),
    topPerformers: performances.flatMap(p => p.topPerformers)
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 10),
    underPerformers: performances.flatMap(p => p.underPerformers)
      .sort((a, b) => a.engagementRate - b.engagementRate)
      .slice(0, 5),
    insights: performances.flatMap(p => p.insights)
  }
}

// Helper function to combine keywords
function combineKeywords(keywordSets: any[]) {
  return keywordSets.flat()
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)
}