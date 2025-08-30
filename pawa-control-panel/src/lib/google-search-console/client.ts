import { google, searchconsole_v1 } from 'googleapis'
import { getGAAuth } from '../google-analytics/auth'

export class SearchConsoleClient {
  private static instance: SearchConsoleClient
  private client: searchconsole_v1.Searchconsole | null = null

  private constructor() {}

  static getInstance(): SearchConsoleClient {
    if (!SearchConsoleClient.instance) {
      SearchConsoleClient.instance = new SearchConsoleClient()
    }
    return SearchConsoleClient.instance
  }

  async initialize(): Promise<searchconsole_v1.Searchconsole> {
    if (!this.client) {
      try {
        const auth = getGAAuth()
        
        this.client = google.searchconsole({
          version: 'v1',
          auth: auth.auth,
        })
        
        console.log('✅ Search Console Client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize Search Console client:', error)
        throw new Error('Search Console client initialization failed')
      }
    }
    return this.client
  }

  async getClient(): Promise<searchconsole_v1.Searchconsole> {
    if (!this.client) {
      await this.initialize()
    }
    return this.client!
  }

  // Test connection with a simple sites list request
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient()
      
      // Test with a simple sites list request
      await client.sites.list()
      console.log('✅ Search Console connection test passed')
      return true
    } catch (error) {
      console.error('❌ Search Console connection test failed:', error)
      return false
    }
  }

  // Get verified sites for the authenticated user
  async getVerifiedSites(): Promise<string[]> {
    try {
      const client = await this.getClient()
      const response = await client.sites.list()
      
      if (!response.data.siteEntry) {
        return []
      }
      
      return response.data.siteEntry
        .filter(site => site.permissionLevel === 'siteOwner' || site.permissionLevel === 'siteFullUser')
        .map(site => site.siteUrl || '')
        .filter(url => url.length > 0)
    } catch (error) {
      console.error('Error fetching verified sites:', error)
      return []
    }
  }
}

// Helper function
export function getSearchConsoleClient(): SearchConsoleClient {
  return SearchConsoleClient.getInstance()
}