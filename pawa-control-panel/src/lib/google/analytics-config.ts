import { serverEnv } from '@/lib/env'

// Blog to Property ID mapping configuration
export const BLOG_ANALYTICS_CONFIG = {
  // Required blogs
  'blog1': serverEnv.GOOGLE_ANALYTICS_BLOG1_PROPERTY_ID,
  'blog2': serverEnv.GOOGLE_ANALYTICS_BLOG2_PROPERTY_ID,
  // Optional blogs - only include if configured
  ...(serverEnv.GOOGLE_ANALYTICS_BLOG3_PROPERTY_ID ? { 
    'blog3': serverEnv.GOOGLE_ANALYTICS_BLOG3_PROPERTY_ID 
  } : {}),
  ...(serverEnv.GOOGLE_ANALYTICS_BLOG4_PROPERTY_ID ? { 
    'blog4': serverEnv.GOOGLE_ANALYTICS_BLOG4_PROPERTY_ID 
  } : {}),
  ...(serverEnv.GOOGLE_ANALYTICS_BLOG5_PROPERTY_ID ? { 
    'blog5': serverEnv.GOOGLE_ANALYTICS_BLOG5_PROPERTY_ID 
  } : {}),
} as const

// Blog URL to identifier mapping - only include configured blogs
export const BLOG_URL_MAPPING: Record<string, keyof typeof BLOG_ANALYTICS_CONFIG> = {
  [serverEnv.WORDPRESS_BLOG1_URL as string]: 'blog1',
  [serverEnv.WORDPRESS_BLOG2_URL as string]: 'blog2',
  // Only include blog3 if it's configured
  ...(serverEnv.WORDPRESS_BLOG3_URL ? { 
    [serverEnv.WORDPRESS_BLOG3_URL as string]: 'blog3' as const
  } : {}),
}

/**
 * Get Google Analytics Property ID for a specific blog
 */
export function getPropertyIdForBlog(blogIdentifier: string): string | null {
  const config = BLOG_ANALYTICS_CONFIG[blogIdentifier as keyof typeof BLOG_ANALYTICS_CONFIG]
  return (typeof config === 'string' ? config : null) || null
}

/**
 * Get blog identifier from blog URL
 */
export function getBlogIdentifierFromUrl(blogUrl: string): string | null {
  return BLOG_URL_MAPPING[blogUrl] || null
}

/**
 * Get all configured blogs with their analytics properties
 */
export function getAllBlogConfigs() {
  return Object.entries(BLOG_ANALYTICS_CONFIG).map(([blogId, propertyId]) => ({
    blogId,
    propertyId,
    blogUrl: Object.keys(BLOG_URL_MAPPING).find(url => BLOG_URL_MAPPING[url] === blogId)
  })).filter(config => config.blogUrl) // Only return blogs with URLs configured
}

/**
 * Validate that a blog has analytics configured
 */
export function isBlogAnalyticsConfigured(blogIdentifier: string): boolean {
  const propertyId = getPropertyIdForBlog(blogIdentifier)
  return propertyId !== null && propertyId !== undefined
}