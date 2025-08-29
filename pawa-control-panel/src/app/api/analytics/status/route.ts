import { NextResponse } from 'next/server'
import { validateGAConfig } from '@/lib/google-analytics/config'
import { getGAAuth } from '@/lib/google-analytics/auth'
import { getGAClient } from '@/lib/google-analytics/client'

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
      overall: 'unknown' as 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    }

    // Check configuration
    status.configuration.configValid = validateGAConfig()

    if (!status.configuration.configValid) {
      status.overall = 'unhealthy'
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

    // Test client initialization
    try {
      const client = getGAClient()
      await client.initialize()
      status.client.canInitialize = true
      
      // Test actual connection (this might fail if properties don't exist)
      try {
        const connectionTest = await client.testConnection()
        status.client.canConnect = connectionTest
      } catch (connectionError) {
        status.client.error = connectionError instanceof Error ? connectionError.message : 'Connection test failed'
      }
    } catch (clientError) {
      status.client.error = clientError instanceof Error ? clientError.message : 'Client initialization failed'
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