import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { GA_CONFIG } from './config'

export class GA4Client {
  private static instance: GA4Client
  private client: BetaAnalyticsDataClient | null = null

  private constructor() {}

  static getInstance(): GA4Client {
    if (!GA4Client.instance) {
      GA4Client.instance = new GA4Client()
    }
    return GA4Client.instance
  }

  async initialize(): Promise<BetaAnalyticsDataClient> {
    if (!this.client) {
      try {
        // Initialize directly with service account credentials
        this.client = new BetaAnalyticsDataClient({
          keyFile: undefined, // We're using credentials directly
          credentials: GA_CONFIG.credentials,
          projectId: GA_CONFIG.credentials.project_id
        })
        
        console.log('✅ GA4 Client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize GA4 client:', error)
        throw new Error('GA4 client initialization failed')
      }
    }
    return this.client
  }

  async getClient(): Promise<BetaAnalyticsDataClient> {
    if (!this.client) {
      await this.initialize()
    }
    return this.client!
  }

  // Test connection
  async testConnection(propertyId: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      
      // Simple test request
      await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'yesterday',
          },
        ],
        metrics: [
          {
            name: 'totalUsers',
          },
        ],
        limit: 1
      })
      
      return true
    } catch (error) {
      console.error('❌ GA4 connection test failed:', error)
      return false
    }
  }
}

// Helper function
export function getGA4Client(): GA4Client {
  return GA4Client.getInstance()
}