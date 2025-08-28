export interface OAuthToken {
  id: string
  provider: string
  access_token: string
  refresh_token: string | null
  token_type: string
  expires_at: string
  scope: string | null
  user_email: string | null
  user_name: string | null
  created_at: string
  updated_at: string
}