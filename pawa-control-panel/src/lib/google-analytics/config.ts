// Google Analytics API Configuration
export interface GAConfig {
  credentials: any // eslint-disable-line @typescript-eslint/no-explicit-any
  scopes: string[]
  properties: {
    optemil: string
    einsof7: string
  }
}

export const GA_CONFIG: GAConfig = {
  credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, 'base64').toString())
    : null,
  
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/webmasters'
  ],
  
  properties: {
    optemil: process.env.GOOGLE_ANALYTICS_OPTEMIL_PROPERTY_ID || '498674424',
    einsof7: process.env.GOOGLE_ANALYTICS_EINSOF7_PROPERTY_ID || '498679524'
  }
}

// Property ID mapping helper
export function getPropertyId(blog: string): string {
  switch (blog) {
    case 'optemil':
      return GA_CONFIG.properties.optemil
    case 'einsof7':
      return GA_CONFIG.properties.einsof7
    default:
      throw new Error(`Unknown blog: ${blog}`)
  }
}

// Get all property IDs for combined queries
export function getAllPropertyIds(): string[] {
  return [GA_CONFIG.properties.optemil, GA_CONFIG.properties.einsof7]
}

// Validate configuration
export function validateGAConfig(): boolean {
  console.log('Validating GA Config...')
  
  if (!GA_CONFIG.credentials) {
    console.error('Google Service Account credentials not found in environment variables')
    return false
  }

  // Check if credentials look like a service account (has type: "service_account")
  if (GA_CONFIG.credentials?.web) {
    console.error('❌ OAuth2 Web Client credentials detected - Service Account required for Analytics API')
    console.log('📝 You provided OAuth2 Web Client credentials, but we need Service Account credentials.')
    console.log('🔧 Please create a Service Account in Google Cloud Console and download the JSON key')
    return false
  }

  if (!GA_CONFIG.properties.optemil || !GA_CONFIG.properties.einsof7) {
    console.error('Google Analytics Property IDs not configured')
    return false
  }

  console.log('✅ GA Config validation passed')
  return true
}