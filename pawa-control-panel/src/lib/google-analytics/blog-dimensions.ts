/**
 * Custom Dimensions and Metrics for Blog Analytics
 * These need to be configured in GA4 dashboard first before use
 */

// Custom Dimensions específicas para blogs
export const BLOG_CUSTOM_DIMENSIONS = {
  content_category: 'customEvent:content_category', // SEO, Tech, Health, etc
  article_author: 'customEvent:article_author',
  word_count: 'customEvent:word_count',
  reading_time: 'customEvent:reading_time',
  content_type: 'customEvent:content_type', // blog_post, landing_page, category_page
  publish_date: 'customEvent:publish_date',
  content_language: 'customEvent:content_language'
} as const

// Custom Metrics específicas para blogs
export const BLOG_CUSTOM_METRICS = {
  scroll_depth: 'customEvent:scroll_depth',
  time_to_first_scroll: 'customEvent:time_to_first_scroll',
  social_shares: 'customEvent:social_shares',
  email_signups: 'customEvent:email_signups',
  comment_count: 'customEvent:comment_count',
  reading_progress: 'customEvent:reading_progress'
} as const

// Standard GA4 dimensions relevantes para blogs
export const BLOG_STANDARD_DIMENSIONS = {
  // Traffic dimensions
  sessionMedium: 'sessionMedium',
  sessionSource: 'sessionSource',
  sessionCampaign: 'sessionCampaign',
  
  // Content dimensions
  pageTitle: 'pageTitle',
  pagePath: 'pagePath',
  landingPage: 'landingPage',
  exitPage: 'exitPage',
  
  // User dimensions
  country: 'country',
  deviceCategory: 'deviceCategory',
  browser: 'browser',
  operatingSystem: 'operatingSystem',
  
  // Behavior dimensions
  eventName: 'eventName',
  contentGroup1: 'contentGroup1', // Blog category
  contentGroup2: 'contentGroup2', // Blog subcategory
  contentGroup3: 'contentGroup3'  // Author
} as const

// Standard GA4 metrics relevantes para blogs
export const BLOG_STANDARD_METRICS = {
  // Engagement metrics
  totalUsers: 'totalUsers',
  activeUsers: 'activeUsers',
  sessions: 'sessions',
  screenPageViews: 'screenPageViews',
  averageSessionDuration: 'averageSessionDuration',
  bounceRate: 'bounceRate',
  engagementRate: 'engagementRate',
  
  // Performance metrics
  userEngagementDuration: 'userEngagementDuration',
  eventCount: 'eventCount',
  keyEvents: 'keyEvents',
  
  // Retention metrics
  newUsers: 'newUsers',
  returningUsers: 'returningUsers',
  
  // Time-based metrics
  sessionsPerUser: 'sessionsPerUser',
  screenPageViewsPerSession: 'screenPageViewsPerSession'
} as const

// Combinações de dimensões e métricas para relatórios específicos
export const BLOG_REPORT_COMBINATIONS = {
  trafficBreakdown: {
    dimensions: [
      BLOG_STANDARD_DIMENSIONS.sessionMedium,
      BLOG_STANDARD_DIMENSIONS.sessionSource,
      BLOG_STANDARD_DIMENSIONS.deviceCategory
    ],
    metrics: [
      BLOG_STANDARD_METRICS.sessions,
      BLOG_STANDARD_METRICS.averageSessionDuration,
      BLOG_STANDARD_METRICS.bounceRate,
      BLOG_STANDARD_METRICS.engagementRate,
      BLOG_STANDARD_METRICS.keyEvents
    ]
  },
  
  contentPerformance: {
    dimensions: [
      BLOG_STANDARD_DIMENSIONS.pageTitle,
      BLOG_STANDARD_DIMENSIONS.pagePath,
      BLOG_STANDARD_DIMENSIONS.contentGroup1
    ],
    metrics: [
      BLOG_STANDARD_METRICS.screenPageViews,
      BLOG_STANDARD_METRICS.averageSessionDuration,
      BLOG_STANDARD_METRICS.bounceRate,
      BLOG_STANDARD_METRICS.keyEvents,
      BLOG_STANDARD_METRICS.userEngagementDuration
    ]
  },
  
  userBehavior: {
    dimensions: [
      BLOG_STANDARD_DIMENSIONS.country,
      BLOG_STANDARD_DIMENSIONS.deviceCategory,
      BLOG_STANDARD_DIMENSIONS.browser
    ],
    metrics: [
      BLOG_STANDARD_METRICS.totalUsers,
      BLOG_STANDARD_METRICS.sessions,
      BLOG_STANDARD_METRICS.sessionsPerUser,
      BLOG_STANDARD_METRICS.screenPageViewsPerSession
    ]
  },
  
  landingPageAnalysis: {
    dimensions: [
      BLOG_STANDARD_DIMENSIONS.landingPage,
      BLOG_STANDARD_DIMENSIONS.sessionMedium,
      BLOG_STANDARD_DIMENSIONS.deviceCategory
    ],
    metrics: [
      BLOG_STANDARD_METRICS.sessions,
      BLOG_STANDARD_METRICS.bounceRate,
      BLOG_STANDARD_METRICS.averageSessionDuration,
      BLOG_STANDARD_METRICS.keyEvents
    ]
  }
} as const

// Tipo helper para validação de dimensões e métricas
export type BlogDimension = keyof typeof BLOG_STANDARD_DIMENSIONS | keyof typeof BLOG_CUSTOM_DIMENSIONS
export type BlogMetric = keyof typeof BLOG_STANDARD_METRICS | keyof typeof BLOG_CUSTOM_METRICS
export type BlogReportType = keyof typeof BLOG_REPORT_COMBINATIONS