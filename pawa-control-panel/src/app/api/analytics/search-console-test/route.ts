import { NextResponse } from 'next/server'
import { testSearchConsoleConnection, getKeywordsByBlog } from '@/lib/google-search-console/queries'
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

    console.log('Testing Search Console connection...')
    
    // Test connection first
    const connectionTest = await testSearchConsoleConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Search Console connection failed',
        details: connectionTest.error,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    console.log('✅ Search Console connection successful')
    console.log('Verified sites:', connectionTest.sites)

    // Test keyword fetching
    try {
      const [optemilKeywords, einsof7Keywords, allKeywords] = await Promise.all([
        getKeywordsByBlog('optemil', { startDate: '7daysAgo', endDate: 'yesterday' }, 5),
        getKeywordsByBlog('einsof7', { startDate: '7daysAgo', endDate: 'yesterday' }, 5),
        getKeywordsByBlog('all', { startDate: '7daysAgo', endDate: 'yesterday' }, 10)
      ])

      return NextResponse.json({
        success: true,
        connection: connectionTest,
        keywords: {
          optemil: optemilKeywords,
          einsof7: einsof7Keywords,
          combined: allKeywords
        },
        message: 'Search Console integration working successfully',
        timestamp: new Date().toISOString()
      })

    } catch (keywordError) {
      console.error('Error fetching keywords:', keywordError)
      
      return NextResponse.json({
        success: false,
        connection: connectionTest,
        error: 'Keywords fetch failed',
        details: keywordError instanceof Error ? keywordError.message : 'Unknown keyword error',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Search Console test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}