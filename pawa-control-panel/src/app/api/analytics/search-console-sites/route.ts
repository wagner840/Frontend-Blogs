import { NextResponse } from 'next/server'
import { getSearchConsoleClient } from '@/lib/google-search-console/client'
import { validateGAConfig } from '@/lib/google-analytics/config'

export async function GET() {
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

    console.log('Fetching Search Console sites...')
    
    const client = getSearchConsoleClient()
    
    // Get verified sites
    const sites = await client.getVerifiedSites()
    
    // Also try to get sites list directly
    const searchConsoleClient = await client.getClient()
    let rawSitesResponse
    try {
      rawSitesResponse = await searchConsoleClient.sites.list()
    } catch (error) {
      console.error('Raw sites list error:', error)
      rawSitesResponse = { data: { siteEntry: [] } }
    }

    return NextResponse.json({
      success: true,
      verifiedSites: sites,
      rawSites: rawSitesResponse.data.siteEntry || [],
      sitesCount: sites.length,
      message: sites.length > 0 
        ? `Found ${sites.length} verified sites` 
        : 'No sites found - service account may not be added to Search Console properties',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Search Console sites error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}