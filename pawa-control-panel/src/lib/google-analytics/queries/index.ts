// Export all Google Analytics query functions (GA4)
export {
  getGA4OverviewMetrics as getOverviewMetrics,
  getCombinedGA4OverviewMetrics as getCombinedOverviewMetrics,
  getGA4OverviewMetrics,
  getCombinedGA4OverviewMetrics
} from './ga4-overview'

export {
  getGA4TopPages as getTopPages,
  getCombinedGA4TopPages as getCombinedTopPages,
  getGA4TopPagesByBlog as getTopPagesByBlog,
  getGA4TopPages,
  getCombinedGA4TopPages,
  getGA4TopPagesByBlog
} from './ga4-pages'

export {
  getGA4TrafficSources as getTrafficSources,
  getCombinedGA4TrafficSources as getCombinedTrafficSources,
  getGA4TrafficSourcesByBlog as getTrafficSourcesByBlog,
  getGA4TrafficSources,
  getCombinedGA4TrafficSources,
  getGA4TrafficSourcesByBlog
} from './ga4-traffic'

// Keywords functions using Google Search Console
export {
  getKeywordsByBlog,
  getCombinedKeywords,
  getSearchQueries
} from '../../google-search-console/queries'

// Re-export types
export type {
  AnalyticsOverview,
  TopPage,
  TrafficSource,
  Keyword,
  BlogAnalyticsData,
  DateRange
} from '../types'