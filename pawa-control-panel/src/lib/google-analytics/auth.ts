import { GoogleAuth } from 'google-auth-library'
import { GA_CONFIG, validateGAConfig } from './config'

export class GoogleAnalyticsAuth {
  public auth: GoogleAuth
  private static instance: GoogleAnalyticsAuth

  constructor() {
    if (!validateGAConfig()) {
      throw new Error('Invalid Google Analytics configuration')
    }

    this.auth = new GoogleAuth({
      credentials: GA_CONFIG.credentials,
      scopes: GA_CONFIG.scopes
    })
  }

  // Singleton pattern to reuse auth instance
  static getInstance(): GoogleAnalyticsAuth {
    if (!GoogleAnalyticsAuth.instance) {
      GoogleAnalyticsAuth.instance = new GoogleAnalyticsAuth()
    }
    return GoogleAnalyticsAuth.instance
  }

  // Get authenticated client
  async getClient() {
    try {
      const client = await this.auth.getClient()
      return client
    } catch (error) {
      console.error('Failed to authenticate with Google Analytics:', error)
      throw new Error('Google Analytics authentication failed')
    }
  }

  // Get access token for manual requests
  async getAccessToken(): Promise<string> {
    try {
      const client = await this.getClient()
      const tokenResponse = await client.getAccessToken()
      
      if (!tokenResponse.token) {
        throw new Error('No access token received')
      }
      
      return tokenResponse.token
    } catch (error) {
      console.error('Failed to get access token:', error)
      throw new Error('Access token retrieval failed')
    }
  }

  // Test authentication
  async testAuth(): Promise<boolean> {
    try {
      const token = await this.getAccessToken()
      return !!token
    } catch (error) {
      console.error('Authentication test failed:', error)
      return false
    }
  }
}

// Helper function to get authenticated instance
export function getGAAuth(): GoogleAnalyticsAuth {
  return GoogleAnalyticsAuth.getInstance()
}