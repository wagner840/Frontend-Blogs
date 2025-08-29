// Google Analytics API Types
export interface DateRange {
  startDate: string
  endDate: string
}

export interface GAMetric {
  expression: string
  alias?: string
}

export interface GADimension {
  name: string
}

export interface GAReportRequest {
  viewId: string
  dateRanges: DateRange[]
  metrics: GAMetric[]
  dimensions?: GADimension[]
  orderBys?: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  pageSize?: number
}

// Analytics Data Types (matching current interface)
export interface AnalyticsOverview {
  users: number
  pageViews: number
  sessions: number
  avgSessionDuration: string // formatted as "3:24"
  bounceRate: number
  growth: number
}

export interface TopPage {
  title: string
  slug: string
  views: number
  blog?: string
}

export interface TrafficSource {
  name: string
  percentage: number
  sessions: number
  color?: string
}

export interface Keyword {
  term: string
  position: number
  clicks: number
  impressions: number
}

export interface BlogAnalyticsData {
  id: string
  name: string
  domain: string
  overview: AnalyticsOverview
  topPages: TopPage[]
  trafficSources: TrafficSource[]
  keywords: Keyword[]
  lastUpdated: string
}

// API Response format
export interface GAReportResponse {
  reports: Array<{
    columnHeader: {
      dimensions?: string[]
      metricHeader: {
        metricHeaderEntries: Array<{
          name: string
          type: string
        }>
      }
    }
    data: {
      rows?: Array<{
        dimensions?: string[]
        metrics: Array<{
          values: string[]
        }>
      }>
      totals: Array<{
        values: string[]
      }>
      maximums: Array<{
        values: string[]
      }>
      minimums: Array<{
        values: string[]
      }>
    }
  }>
}