import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // WordPress - Blog 1 and 2 required, Blog 3+ optional
  WORDPRESS_BLOG1_URL: z.string().url(),
  WORDPRESS_BLOG1_USERNAME: z.string().min(1),
  WORDPRESS_BLOG1_PASSWORD: z.string().min(1),
  WORDPRESS_BLOG2_URL: z.string().url(),
  WORDPRESS_BLOG2_USERNAME: z.string().min(1),
  WORDPRESS_BLOG2_PASSWORD: z.string().min(1),
  WORDPRESS_BLOG3_URL: z.string().url().optional(),
  WORDPRESS_BLOG3_USERNAME: z.string().optional(),
  WORDPRESS_BLOG3_PASSWORD: z.string().optional(),

  // Google Analytics & OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_ANALYTICS_BLOG1_PROPERTY_ID: z.string().min(1),
  GOOGLE_ANALYTICS_BLOG2_PROPERTY_ID: z.string().min(1),
  GOOGLE_ANALYTICS_BLOG3_PROPERTY_ID: z.string().optional(),
  
  // Optional additional blogs
  GOOGLE_ANALYTICS_BLOG4_PROPERTY_ID: z.string().optional(),
  GOOGLE_ANALYTICS_BLOG5_PROPERTY_ID: z.string().optional(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
})

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

function validateServerEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => err.path.join('.')).join(', ')
      throw new Error(`Missing or invalid environment variables: ${missingVars}`)
    }
    throw error
  }
}

function validateClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.ZodIssue) => err.path.join('.')).join(', ')
      throw new Error(`Missing or invalid client environment variables: ${missingVars}`)
    }
    throw error
  }
}

// Export different env objects for server and client
export const env = typeof window === 'undefined' 
  ? validateServerEnv()
  : validateClientEnv()

// For server-side usage, export the full env (only validate on server)
export const serverEnv = typeof window === 'undefined' ? validateServerEnv() : {} as Record<string, unknown>