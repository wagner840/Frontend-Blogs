import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuthService } from '@/lib/google/auth'
import { cookies } from 'next/headers'
import { serverEnv } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?error=oauth_error&message=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?error=missing_parameters`
      )
    }

    const cookieStore = cookies()
    const storedCodeVerifier = cookieStore.get('google_code_verifier')?.value
    const storedState = cookieStore.get('google_oauth_state')?.value

    // Verify state parameter (CSRF protection)
    if (!storedState || storedState !== state) {
      console.error('OAuth state mismatch:', { stored: storedState, received: state })
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?error=state_mismatch`
      )
    }

    if (!storedCodeVerifier) {
      console.error('Missing code verifier')
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?error=missing_code_verifier`
      )
    }

    const googleAuth = new GoogleAuthService()

    try {
      // Exchange authorization code for tokens
      const tokenData = await googleAuth.exchangeCodeForTokens(code, storedCodeVerifier)

      // Store tokens securely in Supabase
      const tokenId = await googleAuth.storeTokens(
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expiresAt,
        tokenData.userInfo
      )

      console.log('Google OAuth success:', {
        user: tokenData.userInfo.email,
        tokenId,
        timestamp: new Date().toISOString()
      })

      // Clear temporary cookies
      cookieStore.delete('google_code_verifier')
      cookieStore.delete('google_oauth_state')

      // Set a success cookie (optional, for UI feedback)
      cookieStore.set('google_auth_success', 'true', {
        httpOnly: false, // Allow JS access for UI feedback
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30, // 30 seconds
        path: '/'
      })

      // Redirect to analytics page with success
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?auth=success&user=${encodeURIComponent(tokenData.userInfo.email)}`
      )

    } catch (tokenError) {
      console.error('Token exchange/storage error:', tokenError)
      return NextResponse.redirect(
        `${serverEnv.NEXTAUTH_URL}/analytics?error=token_exchange&message=${encodeURIComponent(tokenError instanceof Error ? tokenError.message : 'Token exchange failed')}`
      )
    }

  } catch (error) {
    console.error('Google OAuth callback error:', error)
    
    return NextResponse.redirect(
      `${serverEnv.NEXTAUTH_URL}/analytics?error=callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Google OAuth2 Callback API',
    description: 'This endpoint handles OAuth callbacks from Google',
    note: 'This endpoint should only be called by Google OAuth service'
  })
}