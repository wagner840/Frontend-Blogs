import { NextRequest, NextResponse } from 'next/server'
import { 
  getOverviewMetrics, 
  getCombinedOverviewMetrics,
  getTopPagesByBlog,
  getTrafficSourcesByBlog,
  getKeywordsByBlog
} from '@/lib/google-analytics/queries'
import { getPropertyId, getAllPropertyIds, validateGAConfig } from '@/lib/google-analytics/config'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 3600

interface BlogParams {
  params: {
    blog: string
  }
}

export async function GET(request: NextRequest, { params }: BlogParams) {
  try {
    // Validate configuration first
    if (!validateGAConfig()) {
      return NextResponse.json(
        { 
          error: 'Google Analytics not configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY and property IDs in environment variables.',
          configured: false
        }, 
        { status: 503 }
      )
    }

    const { blog } = params
    const { searchParams } = new URL(request.url)
    
    // Get date range from query params or default to last 30 days
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'yesterday'
    const dateRange: DateRange = { startDate, endDate }

    // Validate blog parameter
    if (!['optemil', 'einsof7', 'all'].includes(blog)) {
      return NextResponse.json(
        { error: `Invalid blog parameter: ${blog}. Must be 'optemil', 'einsof7', or 'all'` },
        { status: 400 }
      )
    }

    let data
    
    try {
      // Fetch data based on blog selection
      if (blog === 'all') {
        const [overview, topPages, trafficSources, keywords] = await Promise.all([
          getCombinedOverviewMetrics(getAllPropertyIds(), dateRange),
          getTopPagesByBlog('all', dateRange, 5),
          getTrafficSourcesByBlog('all', dateRange),
          getKeywordsByBlog('all', dateRange, 5)
        ])

        data = {
          id: 'all',
          name: 'Todos os Blogs',
          domain: 'combined',
          overview,
          topPages,
          trafficSources,
          keywords,
          lastUpdated: new Date().toISOString()
        }
      } else {
        const propertyId = getPropertyId(blog as 'optemil' | 'einsof7')
        
        const [overview, topPages, trafficSources, keywords] = await Promise.all([
          getOverviewMetrics(propertyId, dateRange),
          getTopPagesByBlog(blog as 'optemil' | 'einsof7', dateRange, 5),
          getTrafficSourcesByBlog(blog as 'optemil' | 'einsof7', dateRange),
          getKeywordsByBlog(blog as 'optemil' | 'einsof7', dateRange, 5)
        ])

        data = {
          id: blog,
          name: blog === 'optemil' ? 'Optemil' : 'Einsof7',
          domain: blog === 'optemil' ? 'optemil.com' : 'einsof7.com',
          overview,
          topPages,
          trafficSources,
          keywords,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json({
        success: true,
        data,
        cached: false,
        timestamp: new Date().toISOString()
      })

      // Set cache headers
      response.headers.set('Cache-Control', `s-maxage=${CACHE_DURATION}, stale-while-revalidate`)
      
      return response

    } catch (analyticsError) {
      console.error('Google Analytics API Error:', analyticsError)
      
      // Return mock data if GA API fails
      const mockData = getMockDataForBlog(blog)
      
      return NextResponse.json({
        success: true,
        data: mockData,
        cached: false,
        fallback: true,
        message: 'Using fallback data due to Google Analytics API unavailability',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Analytics API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Mock data fallback function
function getMockDataForBlog(blog: string) {
  const mockData = {
    'optemil': {
      id: 'optemil',
      name: 'Optemil',
      domain: 'optemil.com',
      overview: {
        users: 28543,
        pageViews: 76234,
        sessions: 32456,
        avgSessionDuration: '4:12',
        bounceRate: 38.5,
        growth: 18.2
      },
      topPages: [
        { title: 'Ozempic: Como Funciona para Emagrecer', slug: '/ozempic-emagrecer', views: 8543, blog: 'Optemil' },
        { title: 'Calistenia para Iniciantes', slug: '/calistenia-iniciantes', views: 4892, blog: 'Optemil' },
        { title: 'TDAH: Guia Completo', slug: '/tdah-guia-completo', views: 3421, blog: 'Optemil' }
      ],
      trafficSources: [
        { name: 'Organic Search', percentage: 72.3, sessions: 23456, color: 'bg-blue-500' },
        { name: 'Direct', percentage: 16.8, sessions: 5445, color: 'bg-green-500' },
        { name: 'Social Media', percentage: 7.2, sessions: 2337, color: 'bg-yellow-500' },
        { name: 'Referral', percentage: 3.7, sessions: 1200, color: 'bg-purple-500' }
      ],
      keywords: [
        { term: 'ozempic', position: 3, clicks: 2543, impressions: 45000 },
        { term: 'calistenia', position: 5, clicks: 1892, impressions: 32000 },
        { term: 'tdah sintomas', position: 4, clicks: 1634, impressions: 28000 }
      ],
      lastUpdated: new Date().toISOString()
    },
    'einsof7': {
      id: 'einsof7',
      name: 'Einsof7',
      domain: 'einsof7.com',
      overview: {
        users: 16688,
        pageViews: 52222,
        sessions: 19876,
        avgSessionDuration: '2:58',
        bounceRate: 45.8,
        growth: 22.8
      },
      topPages: [
        { title: 'Melhores Filmes Netflix 2024', slug: '/melhores-filmes-netflix', views: 6221, blog: 'Einsof7' },
        { title: 'Android TV: Guia Completo', slug: '/android-tv-guia', views: 4103, blog: 'Einsof7' },
        { title: 'Chromecast vs Fire TV Stick', slug: '/chromecast-vs-fire-tv', views: 3856, blog: 'Einsof7' }
      ],
      trafficSources: [
        { name: 'Organic Search', percentage: 64.1, sessions: 12740, color: 'bg-blue-500' },
        { name: 'Direct', percentage: 20.2, sessions: 4015, color: 'bg-green-500' },
        { name: 'Social Media', percentage: 9.4, sessions: 1868, color: 'bg-yellow-500' },
        { name: 'Referral', percentage: 6.3, sessions: 1252, color: 'bg-purple-500' }
      ],
      keywords: [
        { term: 'netflix filmes', position: 2, clicks: 2143, impressions: 38000 },
        { term: 'android tv', position: 7, clicks: 1234, impressions: 20000 },
        { term: 'chromecast', position: 6, clicks: 987, impressions: 18000 }
      ],
      lastUpdated: new Date().toISOString()
    },
    'all': {
      id: 'all',
      name: 'Todos os Blogs',
      domain: 'combined',
      overview: {
        users: 45231,
        pageViews: 128456,
        sessions: 52332,
        avgSessionDuration: '3:24',
        bounceRate: 42.1,
        growth: 20.1
      },
      topPages: [
        { title: 'Ozempic: Como Funciona para Emagrecer', slug: '/ozempic-emagrecer', views: 8543, blog: 'Optemil' },
        { title: 'Melhores Filmes Netflix 2024', slug: '/melhores-filmes-netflix', views: 6221, blog: 'Einsof7' },
        { title: 'Calistenia para Iniciantes', slug: '/calistenia-iniciantes', views: 4892, blog: 'Optemil' }
      ],
      trafficSources: [
        { name: 'Organic Search', percentage: 68.2, sessions: 35696, color: 'bg-blue-500' },
        { name: 'Direct', percentage: 18.5, sessions: 9681, color: 'bg-green-500' },
        { name: 'Social Media', percentage: 8.3, sessions: 4344, color: 'bg-yellow-500' },
        { name: 'Referral', percentage: 5.0, sessions: 2617, color: 'bg-purple-500' }
      ],
      keywords: [
        { term: 'ozempic', position: 3, clicks: 2543, impressions: 45000 },
        { term: 'netflix filmes', position: 2, clicks: 2143, impressions: 38000 },
        { term: 'calistenia', position: 5, clicks: 1892, impressions: 32000 }
      ],
      lastUpdated: new Date().toISOString()
    }
  }

  return mockData[blog as keyof typeof mockData] || mockData['all']
}