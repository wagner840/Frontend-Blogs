# Supabase Next.js Integration Patterns

## Critical Server/Client Component Patterns

### Server Component Data Fetching
```typescript
// app/dashboard/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server'
import { KeywordsDataTable } from '@/components/dashboard/KeywordsDataTable'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Server-side data fetching with proper error handling
  const { data: keywords, error } = await supabase
    .from('keyword_opportunities')
    .select('*')
    .order('opportunity_score', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(`Failed to fetch keywords: ${error.message}`)
  }

  return (
    <div>
      <h1>Keywords Dashboard</h1>
      <KeywordsDataTable initialData={keywords} />
    </div>
  )
}
```

### Client Component for Interactivity
```typescript
// components/dashboard/KeywordsDataTable.tsx (Client Component)
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Props {
  initialData: KeywordOpportunity[]
}

export function KeywordsDataTable({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const supabase = createClient()

  // Real-time subscriptions in client components
  useEffect(() => {
    const channel = supabase
      .channel('keyword_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'keyword_opportunities' },
        (payload) => {
          // Handle real-time updates
          setData(currentData => {
            // Update logic based on payload
            return [...currentData]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    // TanStack Table implementation
    <div>{/* Table JSX */}</div>
  )
}
```

## Server Client Configuration

### Server-side Client (lib/supabase/server.ts)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client for privileged operations
export const createAdminClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only!
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  )
}
```

### Browser Client (lib/supabase/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

## Row Level Security Patterns

### Dashboard-specific RLS Policies
```sql
-- Enable RLS on sensitive tables
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their blog's data
CREATE POLICY "Users can read their blog data" ON content_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_blog_access uba 
      WHERE uba.user_id = auth.uid() 
      AND uba.blog_id = content_posts.blog_id
    )
  );

-- Policy for API service role to perform updates
CREATE POLICY "Service role can manage all data" ON content_posts
  FOR ALL USING (auth.role() = 'service_role');
```

## Authentication Patterns

### Middleware for Auth Protection
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Database Query Patterns

### Optimized Data Fetching
```typescript
// Efficient keyword opportunity fetching
export async function getKeywordOpportunities(
  filters?: {
    blog?: string
    minScore?: number
    searchIntent?: string
  }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('keyword_opportunities')
    .select(`
      blog_name,
      keyword,
      msv,
      kw_difficulty,
      cpc,
      competition,
      search_intent,
      is_used,
      opportunity_score,
      variations_count,
      serp_results_count,
      priority_level
    `)

  if (filters?.blog) {
    query = query.eq('blog_name', filters.blog)
  }
  
  if (filters?.minScore) {
    query = query.gte('opportunity_score', filters.minScore)
  }
  
  if (filters?.searchIntent) {
    query = query.eq('search_intent', filters.searchIntent)
  }

  const { data, error } = await query
    .order('opportunity_score', { ascending: false })
    .limit(1000)

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  return data
}
```

## Error Handling Patterns

### Comprehensive Error Boundaries
```typescript
// app/dashboard/error.tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-xl font-semibold text-red-600">
        Dashboard Error
      </h2>
      <p className="text-gray-600 text-center max-w-md">
        {error.message || 'An unexpected error occurred while loading the dashboard.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  )
}
```

## Performance Optimization Patterns

### Efficient Real-time Subscriptions
```typescript
// Optimized real-time subscription with proper cleanup
export function useKeywordSubscription(blogId?: string) {
  const [keywords, setKeywords] = useState<KeywordOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupSubscription = async () => {
      // Initial data fetch
      const { data: initialData, error } = await supabase
        .from('keyword_opportunities')
        .select('*')
        .eq('blog_id', blogId)
        .order('opportunity_score', { ascending: false })

      if (error) {
        console.error('Failed to fetch initial data:', error)
        setLoading(false)
        return
      }

      setKeywords(initialData)
      setLoading(false)

      // Set up real-time subscription
      channel = supabase
        .channel(`keywords-${blogId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'keyword_opportunities',
            filter: blogId ? `blog_id=eq.${blogId}` : undefined
          },
          (payload) => {
            setKeywords(currentKeywords => {
              switch (payload.eventType) {
                case 'INSERT':
                  return [...currentKeywords, payload.new as KeywordOpportunity]
                case 'UPDATE':
                  return currentKeywords.map(k => 
                    k.keyword === payload.old.keyword ? payload.new as KeywordOpportunity : k
                  )
                case 'DELETE':
                  return currentKeywords.filter(k => k.keyword !== payload.old.keyword)
                default:
                  return currentKeywords
              }
            })
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [blogId, supabase])

  return { keywords, loading }
}
```

## Security Best Practices

### Input Validation and Sanitization
```typescript
import { z } from 'zod'

// Comprehensive validation schemas
export const keywordFilterSchema = z.object({
  blog: z.string().min(1).max(100).optional(),
  minScore: z.number().min(0).max(100).optional(),
  searchIntent: z.enum(['informational', 'commercial', 'transactional', 'navigational']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(50),
})

// API route with proper validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = keywordFilterSchema.parse({
      blog: searchParams.get('blog') || undefined,
      minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
      searchIntent: searchParams.get('searchIntent') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 50,
    })

    const keywords = await getKeywordOpportunities(filters)
    
    return NextResponse.json({
      data: keywords,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: keywords.length,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Common Gotchas and Solutions

### 1. Cookie Handling in App Router
**Problem**: Server actions failing to set cookies
**Solution**: Use try/catch around cookie operations and handle in middleware

### 2. Type Safety with Database Queries
**Problem**: Inconsistent types between database and TypeScript
**Solution**: Generate types from database schema using Supabase CLI

### 3. Real-time Subscription Memory Leaks
**Problem**: Subscriptions not properly cleaned up
**Solution**: Always remove channels in useEffect cleanup

### 4. RLS Policy Conflicts
**Problem**: Policies blocking legitimate data access
**Solution**: Test policies thoroughly and use service role for admin operations

### 5. Environment Variable Exposure
**Problem**: Server secrets accessible on client
**Solution**: Use NEXT_PUBLIC_ prefix only for client-safe variables