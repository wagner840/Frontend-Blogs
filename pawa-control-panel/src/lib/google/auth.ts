import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import { serverEnv } from '@/lib/env'
import { OAuthToken } from '@/types/oauth'
import crypto from 'crypto'

// Google OAuth2 configuration
const GOOGLE_OAUTH_CONFIG = {
  clientId: serverEnv.GOOGLE_CLIENT_ID,
  clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
  redirectUri: `${serverEnv.NEXTAUTH_URL}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.oauth2Client = new OAuth2Client(
      GOOGLE_OAUTH_CONFIG.clientId as string,
      GOOGLE_OAUTH_CONFIG.clientSecret as string,
      GOOGLE_OAUTH_CONFIG.redirectUri as string
    )

    this.supabase = createClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL as string,
      serverEnv.SUPABASE_SERVICE_ROLE_KEY as string
    )
  }

  /**
   * Generate authorization URL with PKCE
   */
  generateAuthUrl(): { authUrl: string; codeVerifier: string; state: string } {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    // Generate state parameter for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_CONFIG.scopes,
      state,
      code_challenge: codeChallenge,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code_challenge_method: 'S256' as any,
      prompt: 'consent' // Force consent screen to get refresh token
    })

    return { authUrl, codeVerifier, state }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _codeVerifier: string
  ): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: Date
    userInfo: { email: string; name: string }
  }> {
    try {
      // Note: The code verifier is handled internally by the OAuth2Client

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code)
      
      if (!tokens.access_token) {
        throw new Error('No access token received')
      }

      // Get user info
      this.oauth2Client.setCredentials(tokens)
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`
          }
        }
      )

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info')
      }

      const userInfo = await userInfoResponse.json()

      const expiresAt = tokens.expiry_date 
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600000) // Default 1 hour

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt,
        userInfo: {
          email: userInfo.email,
          name: userInfo.name
        }
      }
    } catch (error) {
      console.error('Token exchange error:', error)
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Store tokens in Supabase
   */
  async storeTokens(
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date,
    userInfo: { email: string; name: string },
    scope: string = GOOGLE_OAUTH_CONFIG.scopes.join(' ')
  ): Promise<string> {
    try {
      const { data, error } = await (this.supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('oauth_tokens') as any)
        .upsert({
          provider: 'google',
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt.toISOString(),
          scope,
          user_email: userInfo.email,
          user_name: userInfo.name,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_email,provider',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`)
      }

      return data.id
    } catch (error) {
      console.error('Token storage error:', error)
      throw new Error(`Failed to store tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userEmail?: string): Promise<string | null> {
    try {
      const { data: tokenData, error } = await this.supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'google')
        .eq('user_email', userEmail || '')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .single() as { data: OAuthToken | null; error: any }

      if (error || !tokenData) {
        return null
      }

      // Check if token is still valid
      const now = new Date()
      const expiresAt = new Date(tokenData.expires_at)

      if (now < expiresAt) {
        return tokenData.access_token
      }

      // Token expired, try to refresh
      if (!tokenData.refresh_token) {
        return null
      }

      return await this.refreshAccessToken(tokenData.refresh_token, tokenData.id)
    } catch (error) {
      console.error('Get valid access token error:', error)
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string, tokenId: string): Promise<string | null> {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken })
      
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      if (!credentials.access_token) {
        throw new Error('No access token in refresh response')
      }

      const expiresAt = credentials.expiry_date 
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600000)

      // Update token in database
      await (this.supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('oauth_tokens') as any)
        .update({
          access_token: credentials.access_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenId)

      return credentials.access_token
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  /**
   * Revoke tokens and remove from database
   */
  async revokeTokens(userEmail: string): Promise<void> {
    try {
      const { data: tokenData } = await this.supabase
        .from('oauth_tokens')
        .select('access_token, refresh_token')
        .eq('provider', 'google')
        .eq('user_email', userEmail)
        .single() as { data: Pick<OAuthToken, 'access_token' | 'refresh_token'> | null }

      if (tokenData?.access_token) {
        // Revoke token with Google
        await this.oauth2Client.revokeToken(tokenData.access_token)
      }

      // Remove from database
      await this.supabase
        .from('oauth_tokens')
        .delete()
        .eq('provider', 'google')
        .eq('user_email', userEmail)

    } catch (error) {
      console.error('Token revocation error:', error)
      throw new Error(`Failed to revoke tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}