import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { 
  getOverviewMetrics, 
  getCombinedOverviewMetrics,
  getTrafficSourcesByBlog,
  getKeywordsByBlog
} from '@/lib/google-analytics/queries'
import { getPropertyId, getAllPropertyIds, validateGAConfig } from '@/lib/google-analytics/config'
import { InsightsEngine } from '@/lib/analytics/insights-engine'
import { BenchmarkingService } from '@/lib/analytics/benchmarking'
import type { DateRange } from '@/lib/google-analytics/types'

// Cache duration in seconds (30 minutes for insights - shorter than regular analytics)
const CACHE_DURATION = 1800

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    // Get parameters
    const blog = searchParams.get('blog') || 'all'
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

    try {
      let overview
      let trafficSources
      let keywords
      let blogName
      let blogDomain

      // Fetch current data based on blog selection
      if (blog === 'all') {
        const [overviewData, trafficData, keywordData] = await Promise.all([
          getCombinedOverviewMetrics(getAllPropertyIds(), dateRange),
          getTrafficSourcesByBlog('all', dateRange),
          getKeywordsByBlog('all', dateRange, 10)
        ])
        
        overview = overviewData
        trafficSources = trafficData
        keywords = keywordData
        blogName = 'Todos os Blogs'
        blogDomain = 'combined'
      } else {
        const propertyId = getPropertyId(blog as 'optemil' | 'einsof7')
        
        const [overviewData, trafficData, keywordData] = await Promise.all([
          getOverviewMetrics(propertyId, dateRange),
          getTrafficSourcesByBlog(blog as 'optemil' | 'einsof7', dateRange),
          getKeywordsByBlog(blog as 'optemil' | 'einsof7', dateRange, 10)
        ])
        
        overview = overviewData
        trafficSources = trafficData
        keywords = keywordData
        blogName = blog === 'optemil' ? 'Optemil' : 'Einsof7'
        blogDomain = blog === 'optemil' ? 'optemil.com' : 'einsof7.com'
      }

      // Fetch historical data for trend analysis (last 3 months of monthly data)
      const historicalPromises = []
      for (let i = 1; i <= 3; i++) {
        const monthStart = `${30 * i + 30}daysAgo`
        const monthEnd = `${30 * i}daysAgo`
        const monthRange: DateRange = { startDate: monthStart, endDate: monthEnd }
        
        if (blog === 'all') {
          historicalPromises.push(
            getCombinedOverviewMetrics(getAllPropertyIds(), monthRange)
              .then(data => ({ date: monthStart, metrics: data }))
              .catch(() => null)
          )
        } else {
          const propertyId = getPropertyId(blog as 'optemil' | 'einsof7')
          historicalPromises.push(
            getOverviewMetrics(propertyId, monthRange)
              .then(data => ({ date: monthStart, metrics: data }))
              .catch(() => null)
          )
        }
      }

      const historicalData = (await Promise.all(historicalPromises))
        .filter(data => data !== null)

      // Generate comprehensive insights analysis
      const analysis = InsightsEngine.generateAnalysis(
        overview,
        historicalData,
        trafficSources,
        keywords
      )

      // Get industry benchmark comparisons
      const benchmarkComparisons = await BenchmarkingService.compareToIndustry(overview, 'blog')
      
      // Get benchmark-based recommendations
      const benchmarkRecommendations = BenchmarkingService.generateBenchmarkRecommendations(benchmarkComparisons)
      
      // Get performance insights from benchmarks
      const performanceInsights = BenchmarkingService.getPerformanceInsights(benchmarkComparisons)

      const responseData = {
        blog: {
          id: blog,
          name: blogName,
          domain: blogDomain
        },
        overview,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        performanceScore: analysis.performanceScore,
        trendAnalysis: analysis.trendAnalysis,
        benchmarks: {
          comparisons: benchmarkComparisons,
          recommendations: benchmarkRecommendations,
          insights: performanceInsights
        },
        dataPoints: {
          trafficSourcesCount: trafficSources.length,
          keywordsCount: keywords.length,
          historicalMonths: historicalData.length
        },
        generatedAt: new Date().toISOString(),
        dateRange
      }

      const response = NextResponse.json({
        success: true,
        data: responseData,
        cached: false,
        timestamp: new Date().toISOString()
      })

      // Set cache headers (shorter cache for insights)
      response.headers.set('Cache-Control', `s-maxage=${CACHE_DURATION}, stale-while-revalidate`)
      
      return response

    } catch (analyticsError) {
      console.error('Google Analytics API Error in Insights:', analyticsError)
      
      // Return mock insights data if GA API fails
      const mockInsightsData = await getMockInsightsData(blog)
      
      return NextResponse.json({
        success: true,
        data: mockInsightsData,
        cached: false,
        fallback: true,
        message: 'Using fallback insights data due to Google Analytics API unavailability',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Analytics Insights API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Mock insights data fallback function
async function getMockInsightsData(blog: string) {
  // Get mock analytics data first
  const mockAnalyticsMap = {
    'optemil': {
      overview: {
        users: 28543,
        pageViews: 76234,
        sessions: 32456,
        avgSessionDuration: '4:12',
        bounceRate: 38.5,
        growth: 18.2
      },
      trafficSources: [
        { name: 'Organic Search', percentage: 72.3, sessions: 23456 },
        { name: 'Direct', percentage: 16.8, sessions: 5445 }
      ],
      keywords: [
        { term: 'ozempic', position: 3, clicks: 2543, impressions: 45000 }
      ]
    },
    'einsof7': {
      overview: {
        users: 16688,
        pageViews: 52222,
        sessions: 19876,
        avgSessionDuration: '2:58',
        bounceRate: 45.8,
        growth: 22.8
      },
      trafficSources: [
        { name: 'Organic Search', percentage: 64.1, sessions: 12740 },
        { name: 'Direct', percentage: 20.2, sessions: 4015 }
      ],
      keywords: [
        { term: 'netflix filmes', position: 2, clicks: 2143, impressions: 38000 }
      ]
    },
    'all': {
      overview: {
        users: 45231,
        pageViews: 128456,
        sessions: 52332,
        avgSessionDuration: '3:24',
        bounceRate: 42.1,
        growth: 20.1
      },
      trafficSources: [
        { name: 'Organic Search', percentage: 68.2, sessions: 35696 },
        { name: 'Direct', percentage: 18.5, sessions: 9681 }
      ],
      keywords: [
        { term: 'ozempic', position: 3, clicks: 2543, impressions: 45000 }
      ]
    }
  }

  const mockData = mockAnalyticsMap[blog as keyof typeof mockAnalyticsMap] || mockAnalyticsMap['all']
  
  // Generate mock insights using the actual InsightsEngine
  const mockAnalysis = InsightsEngine.generateAnalysis(
    mockData.overview,
    [], // No historical data for mock
    mockData.trafficSources,
    mockData.keywords
  )

  const mockBenchmarks = await BenchmarkingService.compareToIndustry(mockData.overview, 'blog')
  const mockBenchmarkRecommendations = BenchmarkingService.generateBenchmarkRecommendations(mockBenchmarks)
  const mockPerformanceInsights = BenchmarkingService.getPerformanceInsights(mockBenchmarks)

  return {
    blog: {
      id: blog,
      name: blog === 'optemil' ? 'Optemil' : blog === 'einsof7' ? 'Einsof7' : 'Todos os Blogs',
      domain: blog === 'optemil' ? 'optemil.com' : blog === 'einsof7' ? 'einsof7.com' : 'combined'
    },
    overview: mockData.overview,
    insights: mockAnalysis.insights,
    recommendations: mockAnalysis.recommendations,
    performanceScore: mockAnalysis.performanceScore,
    trendAnalysis: mockAnalysis.trendAnalysis,
    benchmarks: {
      comparisons: mockBenchmarks,
      recommendations: mockBenchmarkRecommendations,
      insights: mockPerformanceInsights
    },
    dataPoints: {
      trafficSourcesCount: mockData.trafficSources.length,
      keywordsCount: mockData.keywords.length,
      historicalMonths: 0
    },
    generatedAt: new Date().toISOString(),
    dateRange: { startDate: '30daysAgo', endDate: 'yesterday' }
  }
}