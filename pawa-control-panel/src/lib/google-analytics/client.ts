import { google } from 'googleapis'
import { getGAAuth } from './auth'

export class GoogleAnalyticsClient {
  private static instance: GoogleAnalyticsClient
  private analytics: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
  private analyticsReporting: any = null // eslint-disable-line @typescript-eslint/no-explicit-any

  private constructor() {}

  static getInstance(): GoogleAnalyticsClient {
    if (!GoogleAnalyticsClient.instance) {
      GoogleAnalyticsClient.instance = new GoogleAnalyticsClient()
    }
    return GoogleAnalyticsClient.instance
  }

  // Initialize the analytics client
  async initialize() {
    try {
      const auth = getGAAuth()
      const authInstance = auth.auth // Get the GoogleAuth instance directly
      
      this.analytics = google.analytics({
        version: 'v3',
        auth: authInstance
      })

      // Also initialize Analytics Reporting API v4
      this.analyticsReporting = google.analyticsreporting({
        version: 'v4', 
        auth: authInstance
      })

      return this.analytics
    } catch (error) {
      console.error('Failed to initialize Google Analytics client:', error)
      throw new Error('Google Analytics client initialization failed')
    }
  }

  // Get Analytics Reporting client (v4 - more features)
  async getReportingClient() {
    if (!this.analyticsReporting) {
      await this.initialize()
    }
    return this.analyticsReporting
  }

  // Get basic Analytics client (v3)
  async getAnalyticsClient() {
    if (!this.analytics) {
      await this.initialize()
    }
    return this.analytics
  }

  // Generic batch get method for reports
  async batchGetReports(requests: any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      const reporting = await this.getReportingClient()
      const response = await reporting.reports.batchGet({
        requestBody: {
          reportRequests: requests
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Batch get reports failed:', error)
      throw new Error(`Google Analytics API request failed: ${error}`)
    }
  }

  // Test client connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize()
      
      // Try a simple request to test connectivity
      const testRequest = {
        viewId: '498674424', // Optemil property ID
        dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
        metrics: [{ expression: 'ga:sessions' }]
      }
      
      await this.batchGetReports([testRequest])
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

// Helper function to get client instance
export function getGAClient(): GoogleAnalyticsClient {
  return GoogleAnalyticsClient.getInstance()
}