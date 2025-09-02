import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { findSEOOpportunities } from '@/lib/search-console/queries/seo-opportunities'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (1 hour for SEO data)
const CACHE_DURATION = 3600

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get parameters
    const blog = searchParams.get('blog') as 'optemil' | 'einsof7' | null
    const period = searchParams.get('period') || '28d'
    const includeComparison = searchParams.get('comparison') === 'true'
    
    // Validate blog parameter
    if (!blog || !['optemil', 'einsof7'].includes(blog)) {
      return NextResponse.json(
        { error: `Invalid blog parameter: ${blog}. Must be 'optemil' or 'einsof7'` },
        { status: 400 }
      )
    }

    // Convert period to date range
    const dateRange = convertPeriodToDateRange(period)
    
    // Get previous period for comparison if requested
    let previousDateRange: DateRange | undefined
    if (includeComparison) {
      previousDateRange = getPreviousDateRange(period)
    }

    try {
      console.log(`🔍 Fetching SEO opportunities for ${blog} (${period})...`)
      
      const seoOpportunities = await findSEOOpportunities(
        blog,
        dateRange,
        previousDateRange
      )

      const response = NextResponse.json({
        success: true,
        data: {
          blog,
          name: blog === 'optemil' ? 'Optemil' : 'Einsof7',
          period,
          dateRange,
          previousDateRange,
          ...seoOpportunities
        },
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
        error: 'Failed to fetch SEO opportunities',
        message: 'Unable to retrieve data from Google Search Console. Please try again later.',
        fallback: false,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

  } catch (error) {
    console.error('SEO Opportunities API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
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

// Helper function to get previous period for comparison
function getPreviousDateRange(period: string): DateRange {
  switch (period) {
    case '7d':
      return { startDate: '14daysAgo', endDate: '8daysAgo' }
    case '28d':
      return { startDate: '56daysAgo', endDate: '29daysAgo' }
    case '90d':
      return { startDate: '180daysAgo', endDate: '91daysAgo' }
    case '6m':
      return { startDate: '360daysAgo', endDate: '181daysAgo' }
    case '1y':
      return { startDate: '730daysAgo', endDate: '366daysAgo' }
    default:
      return { startDate: '56daysAgo', endDate: '29daysAgo' }
  }
}