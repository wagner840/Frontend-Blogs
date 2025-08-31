import { NextResponse } from 'next/server'
import { validateGAConfig, GA_CONFIG } from '@/lib/google-analytics/config'
import { getGAAuth } from '@/lib/google-analytics/auth'
import { getGA4Client } from '@/lib/google-analytics/ga4-client'

export async function GET() {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      configuration: {
        hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        hasOptemilProperty: !!process.env.GOOGLE_ANALYTICS_OPTEMIL_PROPERTY_ID,
        hasEinsof7Property: !!process.env.GOOGLE_ANALYTICS_EINSOF7_PROPERTY_ID,
        configValid: false
      },
      authentication: {
        canInitialize: false,
        canGetToken: false,
        error: null as string | null
      },
      client: {
        canInitialize: false,
        canConnect: false,
        error: null as string | null
      },
      overall: 'unknown' as 'healthy' | 'degraded' | 'unhealthy' | 'unknown',
      buildTime: process.env.NODE_ENV === 'development' ? false : true
    }

    // Check configuration
    status.configuration.configValid = validateGAConfig()

    if (!status.configuration.configValid) {
      status.overall = 'unhealthy'
      return NextResponse.json(status)
    }

    // Skip API calls during build time to prevent static generation failures
    if (status.buildTime) {
      status.overall = 'degraded'
      status.authentication.error = 'Skipped during build time'
      status.client.error = 'Skipped during build time'
      return NextResponse.json(status)
    }

    // Test authentication
    try {
      const auth = getGAAuth()
      status.authentication.canInitialize = true
      
      const token = await auth.getAccessToken()
      status.authentication.canGetToken = !!token
    } catch (authError) {
      status.authentication.error = authError instanceof Error ? authError.message : 'Authentication failed'
    }

    // Test GA4 client initialization
    try {
      const ga4Client = getGA4Client()
      await ga4Client.initialize()
      status.client.canInitialize = true
      
      // Test actual connection using GA4 API (test with primary property)
      try {
        const connectionTest = await ga4Client.testConnection(GA_CONFIG.properties.optemil)
        status.client.canConnect = connectionTest
      } catch (connectionError) {
        status.client.error = connectionError instanceof Error ? connectionError.message : 'GA4 connection test failed'
      }
    } catch (clientError) {
      status.client.error = clientError instanceof Error ? clientError.message : 'GA4 client initialization failed'
    }

    // Determine overall status
    if (
      status.configuration.configValid &&
      status.authentication.canInitialize &&
      status.authentication.canGetToken &&
      status.client.canInitialize
    ) {
      if (status.client.canConnect) {
        status.overall = 'healthy'
      } else {
        status.overall = 'degraded' // Config and auth work, but connection issues
      }
    } else {
      status.overall = 'unhealthy'
    }

    const httpStatus = status.overall === 'healthy' ? 200 :
                      status.overall === 'degraded' ? 206 : 503

    return NextResponse.json(status, { status: httpStatus })

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      overall: 'unhealthy'
    }, { status: 500 })
  }
}