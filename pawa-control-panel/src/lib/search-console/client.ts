import { google } from 'googleapis'
import { getGAAuth } from '@/lib/google-analytics/auth'
import { DateRange } from '@/lib/google-analytics/types'

export interface SearchConsoleQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsolePage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleCountry {
  country: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleDevice {
  device: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsolePerformanceData {
  queries: SearchConsoleQuery[]
  pages: SearchConsolePage[]
  countries: SearchConsoleCountry[]
  devices: SearchConsoleDevice[]
  totalClicks: number
  totalImpressions: number
  averageCTR: number
  averagePosition: number
}

export interface SitemapStatus {
  path: string
  lastSubmitted: string | null
  isPending: boolean
  isSitemapsIndex: boolean
  type: string
  lastDownloaded: string | null
  warnings: number
  errors: number
}

export interface IndexingStatus {
  inspectionResult: {
    indexStatusResult: {
      verdict: string
      coverageState: string
      robotsTxtState: string
      indexingState: string
      lastCrawlTime: string | null
    }
  }
}

export class SearchConsoleClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private webmasters: any
  private initialized = false

  constructor() {
    // Constructor vazio - inicialização lazy
  }

  private async initialize() {
    if (this.initialized) return

    try {
      const gaAuth = getGAAuth()
      const authClient = await gaAuth.getClient()
      this.webmasters = google.webmasters({
        version: 'v3',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        auth: authClient as any
      })
      this.initialized = true
      console.log('✅ Search Console Client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Search Console client:', error)
      throw new Error('Search Console client initialization failed')
    }
  }

  async getSearchPerformance(
    siteUrl: string, 
    dateRange: DateRange,
    dimensions: string[] = ['query'],
    rowLimit: number = 25000
  ): Promise<SearchConsolePerformanceData> {
    await this.initialize()

    try {
      const response = await this.webmasters.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: this.formatDateForSearchConsole(dateRange.startDate),
          endDate: this.formatDateForSearchConsole(dateRange.endDate),
          dimensions,
          rowLimit
        }
      })

      const rows = response.data.rows || []
      
      // Processar dados baseado nas dimensões solicitadas
      const processedData: SearchConsolePerformanceData = {
        queries: [],
        pages: [],
        countries: [],
        devices: [],
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
        averagePosition: 0
      }

      let totalClicks = 0
      let totalImpressions = 0
      let totalCTR = 0
      let totalPosition = 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((row: any) => {
        const clicks = row.clicks || 0
        const impressions = row.impressions || 0
        const ctr = row.ctr || 0
        const position = row.position || 0

        totalClicks += clicks
        totalImpressions += impressions
        totalCTR += ctr
        totalPosition += position

        if (dimensions.includes('query')) {
          processedData.queries.push({
            query: row.keys[0],
            clicks,
            impressions,
            ctr: Math.round(ctr * 10000) / 100, // Convert to percentage
            position: Math.round(position * 10) / 10
          })
        } else if (dimensions.includes('page')) {
          processedData.pages.push({
            page: row.keys[0],
            clicks,
            impressions,
            ctr: Math.round(ctr * 10000) / 100,
            position: Math.round(position * 10) / 10
          })
        } else if (dimensions.includes('country')) {
          processedData.countries.push({
            country: row.keys[0],
            clicks,
            impressions,
            ctr: Math.round(ctr * 10000) / 100,
            position: Math.round(position * 10) / 10
          })
        } else if (dimensions.includes('device')) {
          processedData.devices.push({
            device: row.keys[0],
            clicks,
            impressions,
            ctr: Math.round(ctr * 10000) / 100,
            position: Math.round(position * 10) / 10
          })
        }
      })

      processedData.totalClicks = totalClicks
      processedData.totalImpressions = totalImpressions
      processedData.averageCTR = rows.length > 0 ? Math.round((totalCTR / rows.length) * 10000) / 100 : 0
      processedData.averagePosition = rows.length > 0 ? Math.round((totalPosition / rows.length) * 10) / 10 : 0

      return processedData

    } catch (error) {
      console.error('Error fetching Search Console performance:', error)
      throw new Error(`Search Console API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSitemaps(siteUrl: string): Promise<SitemapStatus[]> {
    await this.initialize()

    try {
      const response = await this.webmasters.sitemaps.list({
        siteUrl
      })

      const sitemaps = response.data.sitemap || []
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sitemaps.map((sitemap: any) => ({
        path: sitemap.path,
        lastSubmitted: sitemap.lastSubmitted || null,
        isPending: sitemap.isPending || false,
        isSitemapsIndex: sitemap.isSitemapsIndex || false,
        type: sitemap.type || 'web',
        lastDownloaded: sitemap.lastDownloaded || null,
        warnings: sitemap.warnings || 0,
        errors: sitemap.errors || 0
      }))

    } catch (error) {
      console.error('Error fetching sitemaps:', error)
      throw new Error(`Sitemaps API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getIndexingStatus(siteUrl: string, url: string): Promise<IndexingStatus> {
    await this.initialize()

    try {
      const response = await this.webmasters.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl
        }
      })

      return response.data

    } catch (error) {
      console.error('Error fetching indexing status:', error)
      throw new Error(`URL Inspection API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async testConnection(siteUrl: string): Promise<boolean> {
    try {
      await this.initialize()
      
      // Test with a simple query
      await this.webmasters.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: '2024-08-01',
          endDate: '2024-08-01',
          dimensions: ['query'],
          rowLimit: 1
        }
      })
      
      return true
    } catch (error) {
      console.error('❌ Search Console connection test failed:', error)
      return false
    }
  }

  private formatDateForSearchConsole(dateString: string): string {
    // Converter formato GA4 para Search Console (YYYY-MM-DD)
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

    // Se já estiver no formato correto
    return dateString
  }
}

// Helper function para instância singleton
let searchConsoleClient: SearchConsoleClient | null = null

export function getSearchConsoleClient(): SearchConsoleClient {
  if (!searchConsoleClient) {
    searchConsoleClient = new SearchConsoleClient()
  }
  return searchConsoleClient
}