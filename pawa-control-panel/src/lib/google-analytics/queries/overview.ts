import { getGAClient } from '../client'
import { GAReportRequest, GAReportResponse, AnalyticsOverview, DateRange } from '../types'

// Helper to format session duration from seconds to "MM:SS" format
function formatSessionDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Helper to calculate growth percentage
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0
  return Number(((current - previous) / previous * 100).toFixed(1))
}

// Get overview metrics for a specific view ID (property)
export async function getOverviewMetrics(
  viewId: string, 
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' }
): Promise<AnalyticsOverview> {
  try {
    const client = await getGAClient()
    const reporting = await client.getReportingClient()

    // Current period metrics
    const currentRequest: GAReportRequest = {
      viewId,
      dateRanges: [dateRange],
      metrics: [
        { expression: 'ga:users' },
        { expression: 'ga:pageviews' },
        { expression: 'ga:sessions' },
        { expression: 'ga:avgSessionDuration' },
        { expression: 'ga:bounceRate' }
      ]
    }

    // Previous period for comparison (same length as current period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 60) // 60 days ago
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 31) // 31 days ago

    const previousRequest: GAReportRequest = {
      viewId,
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }],
      metrics: [
        { expression: 'ga:users' },
        { expression: 'ga:pageviews' },
        { expression: 'ga:sessions' }
      ]
    }

    // Execute both requests
    const [currentResponse, previousResponse] = await Promise.all([
      reporting.reports.batchGet({ requestBody: { reportRequests: [currentRequest] } }),
      reporting.reports.batchGet({ requestBody: { reportRequests: [previousRequest] } })
    ])

    const currentData = currentResponse.data as GAReportResponse
    const previousData = previousResponse.data as GAReportResponse

    if (!currentData.reports?.[0]?.data?.totals?.[0]?.values) {
      throw new Error('No data returned from Google Analytics')
    }

    const currentValues = currentData.reports[0].data.totals[0].values
    const previousValues = previousData.reports?.[0]?.data?.totals?.[0]?.values || ['0', '0', '0']

    const currentUsers = parseInt(currentValues[0])
    const currentPageViews = parseInt(currentValues[1])
    const currentSessions = parseInt(currentValues[2])
    const avgSessionDuration = parseFloat(currentValues[3])
    const bounceRate = parseFloat(currentValues[4])

    const previousUsers = parseInt(previousValues[0])
    const previousPageViews = parseInt(previousValues[1])

    return {
      users: currentUsers,
      pageViews: currentPageViews,
      sessions: currentSessions,
      avgSessionDuration: formatSessionDuration(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 10) / 10, // Round to 1 decimal
      growth: calculateGrowth(currentUsers, previousUsers)
    }

  } catch (error) {
    console.error('Error fetching overview metrics:', error)
    
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

// Get combined overview metrics for multiple view IDs
export async function getCombinedOverviewMetrics(
  viewIds: string[],
  dateRange?: DateRange
): Promise<AnalyticsOverview> {
  try {
    const metrics = await Promise.all(
      viewIds.map(viewId => getOverviewMetrics(viewId, dateRange))
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
    console.error('Error fetching combined overview metrics:', error)
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