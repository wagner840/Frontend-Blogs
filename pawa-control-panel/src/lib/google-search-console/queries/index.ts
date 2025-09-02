import { getSearchConsoleClient } from '../client'
import { DateRange } from '@/lib/google-analytics/types'

export interface KeywordPerformance {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  blog: 'optemil' | 'einsof7'
}

export interface PagePerformance {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  blog: 'optemil' | 'einsof7'
}

export interface DevicePerformance {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface CountryPerformance {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// URL base dos sites para Search Console
const BLOG_DOMAINS = {
  'optemil': 'https://optemil.com',
  'einsof7': 'https://einsof7.com'
}

export async function getKeywordsByBlog(
  blogId: 'optemil' | 'einsof7',
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' },
  limit: number = 25
): Promise<KeywordPerformance[]> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    console.log(`🔍 Fetching keywords for ${blogId} (${siteUrl})...`)
    
    const data = await client.getSearchPerformance(
      siteUrl,
      dateRange,
      ['query'],
      limit
    )

    return data.queries.map(query => ({
      query: query.query,
      clicks: query.clicks,
      impressions: query.impressions,
      ctr: query.ctr,
      position: query.position,
      blog: blogId
    }))

  } catch (error) {
    console.error(`Error fetching keywords for ${blogId}:`, error)
    return []
  }
}

export async function getPagesByBlog(
  blogId: 'optemil' | 'einsof7',
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' },
  limit: number = 25
): Promise<PagePerformance[]> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    console.log(`📄 Fetching pages for ${blogId} (${siteUrl})...`)
    
    const data = await client.getSearchPerformance(
      siteUrl,
      dateRange,
      ['page'],
      limit
    )

    return data.pages.map(page => ({
      page: page.page,
      clicks: page.clicks,
      impressions: page.impressions,
      ctr: page.ctr,
      position: page.position,
      blog: blogId
    }))

  } catch (error) {
    console.error(`Error fetching pages for ${blogId}:`, error)
    return []
  }
}

export async function getDeviceBreakdown(
  blogId: 'optemil' | 'einsof7',
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' }
): Promise<DevicePerformance[]> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    console.log(`📱 Fetching device breakdown for ${blogId} (${siteUrl})...`)
    
    const data = await client.getSearchPerformance(
      siteUrl,
      dateRange,
      ['device'],
      10
    )

    return data.devices.map(device => ({
      device: device.device,
      clicks: device.clicks,
      impressions: device.impressions,
      ctr: device.ctr,
      position: device.position
    }))

  } catch (error) {
    console.error(`Error fetching device breakdown for ${blogId}:`, error)
    return []
  }
}

export async function getCountryBreakdown(
  blogId: 'optemil' | 'einsof7',
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' },
  limit: number = 10
): Promise<CountryPerformance[]> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    console.log(`🌍 Fetching country breakdown for ${blogId} (${siteUrl})...`)
    
    const data = await client.getSearchPerformance(
      siteUrl,
      dateRange,
      ['country'],
      limit
    )

    return data.countries.map(country => ({
      country: country.country,
      clicks: country.clicks,
      impressions: country.impressions,
      ctr: country.ctr,
      position: country.position
    }))

  } catch (error) {
    console.error(`Error fetching country breakdown for ${blogId}:`, error)
    return []
  }
}

export async function getTopQueriesForPage(
  blogId: 'optemil' | 'einsof7',
  pageUrl: string,
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' },
  limit: number = 10
): Promise<KeywordPerformance[]> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    console.log(`🔍 Fetching queries for page: ${pageUrl}`)
    
    // Helper function to format dates
    const formatDateForSearchConsole = (dateString: string): string => {
      if (dateString.includes('daysAgo')) {
        const days = parseInt(dateString.replace('daysAgo', ''))
        const date = new Date()
        date.setDate(date.getDate() - days)
        return date.toISOString().split('T')[0]
      }
      
      if (dateString === 'today') {
        return new Date().toISOString().split('T')[0]
      }
      
      if (dateString === 'yesterday') {
        const date = new Date()
        date.setDate(date.getDate() - 1)
        return date.toISOString().split('T')[0]
      }

      return dateString
    }
    
    // Use Search Console client directly (we need to access webmasters property)
    const { google } = require('googleapis')
    const { getGAAuth } = require('@/lib/google-analytics/auth')
    
    const auth = getGAAuth()
    const webmasters = google.webmasters({
      version: 'v3',
      auth
    })
    
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDateForSearchConsole(dateRange.startDate),
        endDate: formatDateForSearchConsole(dateRange.endDate),
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'equals',
            expression: pageUrl
          }]
        }],
        rowLimit: limit
      }
    })

    const rows = response.data.rows || []
    
    return rows.map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: Math.round((row.ctr || 0) * 10000) / 100,
      position: Math.round((row.position || 0) * 10) / 10,
      blog: blogId
    }))

  } catch (error) {
    console.error(`Error fetching queries for page ${pageUrl}:`, error)
    return []
  }
}

export async function compareKeywordPerformance(
  blogId: 'optemil' | 'einsof7',
  currentRange: DateRange,
  previousRange: DateRange,
  limit: number = 20
) {
  const [currentKeywords, previousKeywords] = await Promise.all([
    getKeywordsByBlog(blogId, currentRange, limit),
    getKeywordsByBlog(blogId, previousRange, limit)
  ])

  return {
    current: currentKeywords,
    previous: previousKeywords,
    changes: calculateKeywordChanges(currentKeywords, previousKeywords)
  }
}

// Helper function to calculate keyword performance changes
function calculateKeywordChanges(
  current: KeywordPerformance[],
  previous: KeywordPerformance[]
) {
  return current.map(currentKeyword => {
    const previousKeyword = previous.find(p => p.query === currentKeyword.query)
    
    if (!previousKeyword) {
      return {
        ...currentKeyword,
        clicksChange: null,
        impressionsChange: null,
        positionChange: null,
        isNew: true
      }
    }

    const clicksChange = previousKeyword.clicks > 0 
      ? ((currentKeyword.clicks - previousKeyword.clicks) / previousKeyword.clicks) * 100
      : 0
    
    const impressionsChange = previousKeyword.impressions > 0
      ? ((currentKeyword.impressions - previousKeyword.impressions) / previousKeyword.impressions) * 100
      : 0
    
    const positionChange = currentKeyword.position - previousKeyword.position

    return {
      ...currentKeyword,
      clicksChange: Math.round(clicksChange * 10) / 10,
      impressionsChange: Math.round(impressionsChange * 10) / 10,
      positionChange: Math.round(positionChange * 10) / 10,
      isNew: false
    }
  })
}