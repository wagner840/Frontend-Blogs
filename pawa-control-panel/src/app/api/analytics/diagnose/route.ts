import { NextResponse } from 'next/server'
import { testAllProperties } from '@/lib/google-analytics/diagnostics'

export async function GET() {
  try {
    console.log('🔍 Starting GA4 diagnostics...')
    const results = await testAllProperties()
    
    return NextResponse.json({
      success: true,
      diagnostics: results,
      summary: {
        totalProperties: results.length,
        propertiesWithData: results.filter(r => r.hasData).length,
        propertiesWithErrors: results.filter(r => r.errors.length > 0).length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Diagnostics Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}