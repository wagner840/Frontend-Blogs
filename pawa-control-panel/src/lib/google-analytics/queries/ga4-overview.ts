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

// Get overview metrics for GA4 property
export async function getGA4OverviewMetrics(
  propertyId: string,
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' }
): Promise<AnalyticsOverview> {
  try {
    const client = await getGA4Client().getClient()
    
    // Current period request
    const [currentResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    })

    // Previous period for comparison (same length as current period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 60) // 60 days ago
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 31) // 31 days ago

    const [previousResponse] = await client.runReport({
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

    // Extract current data
    const currentRow = currentResponse.rows?.[0]
    if (!currentRow?.metricValues) {
      throw new Error('No data returned from GA4')
    }

    const currentUsers = parseInt(currentRow.metricValues[0].value || '0')
    const currentPageViews = parseInt(currentRow.metricValues[1].value || '0')
    const currentSessions = parseInt(currentRow.metricValues[2].value || '0')
    const avgSessionDuration = parseFloat(currentRow.metricValues[3].value || '0')
    const bounceRate = parseFloat(currentRow.metricValues[4].value || '0') * 100 // GA4 returns as decimal

    // Extract previous data for comparison
    const previousRow = previousResponse.rows?.[0]
    const previousUsers = parseInt(previousRow?.metricValues?.[0]?.value || '0')

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
    
    // Fallback to mock data if API fails
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