import { NextRequest, NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { GoogleAuthService } from '@/lib/google/auth'
import { getPropertyIdForBlog, getBlogIdentifierFromUrl, BLOG_ANALYTICS_CONFIG } from '@/lib/google/analytics-config'
import { z } from 'zod'

// Request schema for analytics API
const analyticsRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  blogId: z.string().min(1, 'Blog ID is required'),
  blogUrl: z.string().url().optional(), // Alternative to blogId
  metrics: z.array(z.string()).optional().default(['sessions', 'pageviews', 'users']),
  dimensions: z.array(z.string()).optional().default(['pagePath']),
  limit: z.number().min(1).max(10000).optional().default(100),
  userEmail: z.string().email().optional()
})

type AnalyticsRequest = z.infer<typeof analyticsRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    let requestData: AnalyticsRequest
    
    try {
      requestData = analyticsRequestSchema.parse(body)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error },
        { status: 400 }
      )
    }

    // Get valid access token
    const googleAuth = new GoogleAuthService()
    const accessToken = await googleAuth.getValidAccessToken(requestData.userEmail)

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Authentication required', 
          message: 'No valid Google Analytics access token found. Please authenticate first.',
          authUrl: '/api/auth/google/connect'
        },
        { status: 401 }
      )
    }

    // Determine blog identifier and get corresponding Property ID
    let blogIdentifier = requestData.blogId
    
    // If blogUrl is provided instead of blogId, resolve the identifier
    if (requestData.blogUrl && !requestData.blogId) {
      const resolvedBlogId = getBlogIdentifierFromUrl(requestData.blogUrl)
      if (!resolvedBlogId) {
        return NextResponse.json(
          { error: 'Unknown blog URL', message: 'The provided blog URL is not configured' },
          { status: 400 }
        )
      }
      blogIdentifier = resolvedBlogId
    }

    // Get Property ID for the specified blog
    const propertyId = getPropertyIdForBlog(blogIdentifier)
    if (!propertyId) {
      return NextResponse.json(
        { 
          error: 'Analytics not configured', 
          message: `Google Analytics Property ID not found for blog: ${blogIdentifier}`,
          availableBlogs: Object.keys(BLOG_ANALYTICS_CONFIG)
        },
        { status: 400 }
      )
    }

    // Initialize Google Analytics client
    const analyticsDataClient = new BetaAnalyticsDataClient()

    try {
      // Build the request for Google Analytics
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: requestData.startDate,
            endDate: requestData.endDate,
          },
        ],
        dimensions: requestData.dimensions.map(name => ({ name })),
        metrics: requestData.metrics.map(name => ({ name })),
        limit: requestData.limit,
        orderBys: [
          {
            metric: {
              metricName: requestData.metrics[0] // Order by first metric
            },
            desc: true
          }
        ]
      })

      // Transform response to more usable format
      const transformedData = {
        dateRange: {
          startDate: requestData.startDate,
          endDate: requestData.endDate
        },
        dimensionHeaders: response.dimensionHeaders?.map(header => ({
          name: header.name,
          type: 'dimension'
        })) || [],
        metricHeaders: response.metricHeaders?.map(header => ({
          name: header.name,
          type: header.type
        })) || [],
        rows: response.rows?.map(row => ({
          dimensions: row.dimensionValues?.map((value, index) => ({
            name: response.dimensionHeaders?.[index]?.name,
            value: value.value
          })) || [],
          metrics: row.metricValues?.map((value, index) => ({
            name: response.metricHeaders?.[index]?.name,
            value: parseFloat(value.value || '0'),
            formattedValue: value.value
          })) || []
        })) || [],
        totals: response.totals?.map(total => ({
          dimensions: [],
          metrics: total.metricValues?.map((value, index) => ({
            name: response.metricHeaders?.[index]?.name,
            value: parseFloat(value.value || '0'),
            formattedValue: value.value
          })) || []
        })) || [],
        rowCount: response.rowCount || 0,
        metadata: {
          currencyCode: response.metadata?.currencyCode,
          timeZone: response.metadata?.timeZone,
          emptyReason: response.metadata?.emptyReason
        }
      }

      console.log('Analytics data fetched successfully:', {
        dateRange: `${requestData.startDate} to ${requestData.endDate}`,
        blogId: blogIdentifier,
        propertyId,
        rowCount: transformedData.rowCount,
        userEmail: requestData.userEmail,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        data: transformedData
      })

    } catch (analyticsError) {
      console.error('Google Analytics API error:', analyticsError)
      
      // Handle specific GA4 errors
      if (analyticsError instanceof Error) {
        if (analyticsError.message.includes('PERMISSION_DENIED')) {
          return NextResponse.json(
            { 
              error: 'Permission denied', 
              message: 'User does not have access to the specified Google Analytics property',
              blogId: blogIdentifier,
              propertyId
            },
            { status: 403 }
          )
        }
        
        if (analyticsError.message.includes('INVALID_ARGUMENT')) {
          return NextResponse.json(
            { 
              error: 'Invalid request', 
              message: 'Invalid metrics, dimensions, or date range specified'
            },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { 
          error: 'Analytics API error', 
          message: analyticsError instanceof Error ? analyticsError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Analytics Data API',
    endpoints: {
      POST: '/api/analytics - Fetch analytics data'
    },
    authentication: 'Google OAuth2 required',
    requiredParameters: {
      startDate: 'YYYY-MM-DD format',
      endDate: 'YYYY-MM-DD format',
      blogId: 'Blog identifier (blog1, blog2, blog3, etc.)',
      blogUrl: 'Alternative to blogId - full blog URL',
      metrics: 'Array of metric names (optional)',
      dimensions: 'Array of dimension names (optional)',
      limit: 'Number of results (optional, max 10000)',
      userEmail: 'Email of authenticated user (optional)'
    },
    exampleRequest: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      blogId: 'blog1',
      metrics: ['sessions', 'pageviews', 'users'],
      dimensions: ['pagePath', 'pageTitle'],
      limit: 100
    },
    alternativeRequest: {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      blogUrl: 'https://yourblog.com',
      metrics: ['sessions', 'pageviews'],
      dimensions: ['pagePath'],
      limit: 50
    }
  })
}