import { getGA4Client } from '../ga4-client'
import { AnalyticsOverview, DateRange } from '../types'

// Format session duration from seconds to "MM:SS" format
function formatSessionDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Calculate growth percentage
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0
  return Number(((current - previous) / previous * 100).toFixed(1))
}

// Get overview metrics for GA4 property with fallback date ranges
export async function getGA4OverviewMetrics(
  propertyId: string,
  dateRange: DateRange = { startDate: '7daysAgo', endDate: 'yesterday' }
): Promise<AnalyticsOverview> {
  try {
    const client = await getGA4Client().getClient()
    
    // Define fallback date ranges in order of preference
    const fallbackRanges = [
      dateRange, // Original requested range
      { startDate: '30daysAgo', endDate: 'yesterday' }, // Last 30 days
      { startDate: '90daysAgo', endDate: 'yesterday' }, // Last 90 days
      { startDate: '365daysAgo', endDate: '30daysAgo' }, // 1 year ago to 30 days ago
      { startDate: '2024-01-01', endDate: '2024-12-31' }, // All of 2024
      { startDate: '2023-01-01', endDate: '2023-12-31' }, // All of 2023
    ]

    let currentResponse: any = null
    let usedRange: DateRange = dateRange

    // Try each date range until we find data
    for (const range of fallbackRanges) {
      try {
        console.log(`🔍 Trying date range: ${range.startDate} to ${range.endDate}`)
        
        const [response] = await client.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [range],
          metrics: [
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        })

        if (response.rows && response.rows.length > 0 && response.rows[0]?.metricValues) {
          console.log(`✅ Found data in range: ${range.startDate} to ${range.endDate}`)
          currentResponse = response
          usedRange = range
          break
        } else {
          console.log(`❌ No data in range: ${range.startDate} to ${range.endDate}`)
        }
      } catch (error) {
        console.log(`❌ Error in range ${range.startDate} to ${range.endDate}:`, error)
        continue
      }
    }

    // If no data found in any range, throw error
    if (!currentResponse?.rows?.[0]?.metricValues) {
      throw new Error(`No data returned from GA4 for property ${propertyId} in any date range. Check if analytics is properly configured and receiving data.`)
    }

    // Try to get previous period for comparison
    let previousResponse: any = null
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 60) // 60 days ago
      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 31) // 31 days ago

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
        ],
      })
      previousResponse = response
    } catch (error) {
      console.warn('Could not fetch previous period data for comparison:', error)
    }

    // Extract current data
    const currentRow = currentResponse.rows[0]
    const currentUsers = parseInt(currentRow.metricValues[0].value || '0')
    const currentPageViews = parseInt(currentRow.metricValues[1].value || '0')
    const currentSessions = parseInt(currentRow.metricValues[2].value || '0')
    const avgSessionDuration = parseFloat(currentRow.metricValues[3].value || '0')
    const bounceRate = parseFloat(currentRow.metricValues[4].value || '0') * 100 // GA4 returns as decimal

    // Extract previous data for comparison
    const previousRow = previousResponse?.rows?.[0]
    const previousUsers = parseInt(previousRow?.metricValues?.[0]?.value || '0')

    // Return the formatted data
    return {
      users: currentUsers,
      pageViews: currentPageViews,
      sessions: currentSessions,
      avgSessionDuration: formatSessionDuration(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 10) / 10, // Round to 1 decimal
      growth: calculateGrowth(currentUsers, previousUsers)
    }
    
  } catch (error) {
    console.error('Error fetching GA4 overview metrics:', error)
    
    // Re-throw the error so it can be handled by the fallback system
    throw error
  }
}

// Get combined overview metrics for multiple properties
export async function getCombinedGA4OverviewMetrics(
  propertyIds: string[],
  dateRange?: DateRange
): Promise<AnalyticsOverview> {
  try {
    const metrics = await Promise.all(
      propertyIds.map(propertyId => getGA4OverviewMetrics(propertyId, dateRange))
    )

    // Combine metrics from all properties
    const combined = metrics.reduce((acc, metric) => ({
      users: acc.users + metric.users,
      pageViews: acc.pageViews + metric.pageViews,
      sessions: acc.sessions + metric.sessions,
      avgSessionDuration: acc.avgSessionDuration, // Will recalculate
      bounceRate: acc.bounceRate, // Will recalculate 
      growth: acc.growth // Will recalculate
    }), {
      users: 0,
      pageViews: 0,
      sessions: 0,
      avgSessionDuration: '0:00',
      bounceRate: 0,
      growth: 0
    })

    // Calculate weighted averages
    const totalSessions = combined.sessions
    if (totalSessions > 0) {
      // Approximate session duration (would need more complex calculation for exact)
      const avgDurationSeconds = metrics.reduce((sum, m) => {
        const [minutes, seconds] = m.avgSessionDuration.split(':').map(Number)
        return sum + (minutes * 60 + seconds) * m.sessions
      }, 0) / totalSessions

      combined.avgSessionDuration = formatSessionDuration(avgDurationSeconds)

      // Average bounce rate weighted by sessions
      combined.bounceRate = Math.round(
        metrics.reduce((sum, m) => sum + m.bounceRate * m.sessions, 0) / totalSessions * 10
      ) / 10

      // Average growth weighted by users
      combined.growth = Math.round(
        metrics.reduce((sum, m) => sum + m.growth * m.users, 0) / combined.users * 10
      ) / 10
    }

    return combined

  } catch (error) {
    console.error('Error fetching combined GA4 overview metrics:', error)
    return {
      users: 0,
      pageViews: 0,
      sessions: 0,
      avgSessionDuration: '0:00',
      bounceRate: 0,
      growth: 0
    }
  }
}