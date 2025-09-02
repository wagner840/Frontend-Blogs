import { getGA4Client } from './ga4-client'

export interface DiagnosticsResult {
  propertyId: string
  propertyName: string | null
  hasData: boolean
  dateRange: string
  rowCount: number
  errors: string[]
  suggestions: string[]
}

export async function diagnoseGA4Connection(propertyId: string): Promise<DiagnosticsResult> {
  const result: DiagnosticsResult = {
    propertyId,
    propertyName: null,
    hasData: false,
    dateRange: '',
    rowCount: 0,
    errors: [],
    suggestions: []
  }

  try {
    const client = await getGA4Client().getClient()
    
    // Test 1: Check if property exists and we have access
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_metadataResponse] = await client.getMetadata({
        name: `properties/${propertyId}/metadata`
      })
      result.propertyName = `Property ${propertyId}` // GA4 API doesn't return name in metadata
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      result.errors.push(`Cannot access property ${propertyId}. Check if property ID is correct and service account has access.`)
      result.suggestions.push('Verify property ID in Google Analytics Admin > Property Settings')
      result.suggestions.push('Add service account as Viewer in Google Analytics Admin > Property Settings > Property Access Management')
    }

    // Test 2: Try different date ranges to find data
    const testRanges = [
      { startDate: 'yesterday', endDate: 'yesterday', name: 'Yesterday' },
      { startDate: '7daysAgo', endDate: 'yesterday', name: 'Last 7 days' },
      { startDate: '30daysAgo', endDate: 'yesterday', name: 'Last 30 days' },
      { startDate: '90daysAgo', endDate: '30daysAgo', name: '90-30 days ago' },
      { startDate: '2024-01-01', endDate: '2024-12-31', name: '2024' },
      { startDate: '2023-01-01', endDate: '2023-12-31', name: '2023' }
    ]

    for (const range of testRanges) {
      try {
        const [response] = await client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [range],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'sessions' }
          ],
          limit: 1
        })

        if (response.rows && response.rows.length > 0) {
          result.hasData = true
          result.dateRange = range.name
          result.rowCount = response.rows.length
          
          const row = response.rows[0]
          const users = row.metricValues?.[0]?.value || '0'
          const pageViews = row.metricValues?.[1]?.value || '0'
          const sessions = row.metricValues?.[2]?.value || '0'
          
          console.log(`✅ Found data in ${range.name}: Users=${users}, PageViews=${pageViews}, Sessions=${sessions}`)
          break
        } else {
          console.log(`❌ No data in ${range.name}`)
        }
      } catch (error) {
        result.errors.push(`Error testing ${range.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    if (!result.hasData) {
      result.errors.push('No data found in any date range')
      result.suggestions.push('Check if Google Analytics is properly installed on your website')
      result.suggestions.push('Verify that the property is receiving traffic')
      result.suggestions.push('GA4 data has 24-48 hour processing delay')
      result.suggestions.push('Try using a wider date range (e.g., last 30-90 days)')
    }

  } catch (error) {
    result.errors.push(`GA4 Client Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.suggestions.push('Check GOOGLE_SERVICE_ACCOUNT_KEY in environment variables')
    result.suggestions.push('Verify Google Analytics Reporting API is enabled in Google Cloud Console')
  }

  return result
}

export async function testAllProperties(): Promise<DiagnosticsResult[]> {
  const properties = [
    { id: process.env.GOOGLE_ANALYTICS_OPTEMIL_PROPERTY_ID!, name: 'Optemil' },
    { id: process.env.GOOGLE_ANALYTICS_EINSOF7_PROPERTY_ID!, name: 'Einsof7' }
  ]

  const results: DiagnosticsResult[] = []
  
  for (const prop of properties) {
    if (prop.id) {
      console.log(`🔍 Testing ${prop.name} (${prop.id})...`)
      const result = await diagnoseGA4Connection(prop.id)
      results.push(result)
    }
  }

  return results
}