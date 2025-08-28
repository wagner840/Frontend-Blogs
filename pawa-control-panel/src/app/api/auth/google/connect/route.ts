import { NextResponse } from 'next/server'
import { GoogleAuthService } from '@/lib/google/auth'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const googleAuth = new GoogleAuthService()
    const { authUrl, codeVerifier, state } = googleAuth.generateAuthUrl()

    // Store PKCE code verifier and state in secure HTTP-only cookies
    const cookieStore = cookies()
    
    // Set cookies with secure options
    cookieStore.set('google_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })

    cookieStore.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    })

    console.log('Google OAuth flow initiated:', {
      state,
      timestamp: new Date().toISOString()
    })

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    
    return NextResponse.json(
      { 
        error: 'OAuth initialization failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Google OAuth2 Connect API',
    description: 'Use GET method to initiate OAuth flow',
    endpoints: {
      GET: '/api/auth/google/connect - Initiate OAuth flow',
      callback: '/api/auth/google/callback - Handle OAuth callback'
    }
  })
}