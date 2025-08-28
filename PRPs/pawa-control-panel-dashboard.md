# PAWA Control Panel Dashboard - Implementation PRP

## Goal

Build a comprehensive Next.js 14 SEO and content management dashboard that integrates with the existing PAWA backend system. The dashboard will provide keyword opportunity visualization, WordPress content synchronization, Google Analytics integration, and production pipeline management through a modern, type-safe, and performant web interface.

## Why

- **Unified SEO Management**: Consolidate all PAWA system functionality into a single, powerful dashboard interface
- **Real-time Data Synchronization**: Enable automatic WordPress content pipeline integration without manual intervention
- **Advanced Analytics Integration**: Provide comprehensive Google Analytics insights integrated with SEO workflow data
- **Enhanced User Experience**: Deliver a modern, responsive interface for efficient keyword and content management
- **Scalable Architecture**: Implement enterprise-grade patterns for maintainable, secure, and performant operation

## What

A full-stack Next.js 14 dashboard application with the following user-visible features:

### Success Criteria

- [ ] **Keywords Data Table**: Advanced filtering, sorting, and pagination with real-time data from keyword_opportunities view
- [ ] **WordPress Sync**: Automated webhook endpoint receiving and processing WordPress post updates 
- [ ] **Google Analytics Dashboard**: OAuth2-secured analytics visualizations with interactive charts
- [ ] **Production Pipeline**: Kanban-style content workflow management
- [ ] **Performance**: Sub-2-second page loads, responsive design, 99.9% uptime
- [ ] **Security**: Row-level security, input validation, secure API endpoints
- [ ] **Type Safety**: 100% TypeScript coverage with Zod validation for all external data

## All Needed Context

### Documentation & References

```yaml
# CRITICAL READS - Include these in your context window
- url: https://supabase.com/docs/guides/auth/server-side/nextjs
  why: Essential patterns for Supabase server-side authentication with Next.js
  critical: Server vs client component data fetching patterns

- url: https://supabase.com/docs/guides/auth/server-side/creating-a-client  
  why: Proper createServerClient vs createBrowserClient implementation
  critical: Cookie handling and session management in App Router

- url: https://tanstack.com/table/latest/docs/framework/react/guide/data-tables
  why: TanStack Table v8 implementation patterns for complex data tables
  critical: Server-side pagination, filtering, and column management

- file: claude_md_files/CLAUDE-NEXTJS-15.md
  why: Project structure, TypeScript requirements, and Next.js 15 patterns
  critical: App Router patterns, server/client component integration

- file: PRPs/pawa-control-panel-planning-prd.md
  why: Comprehensive project requirements, database schema, and architecture
  critical: Success criteria, technical specifications, and user stories

- docfile: PRPs/ai_docs/supabase-nextjs-patterns.md
  why: Supabase integration patterns specific to dashboard applications
```

### Current Database Schema (From PAWA Backend)

**keyword_opportunities view columns:**
- `blog_name` (varchar) - Blog identifier
- `keyword` (varchar) - Target keyword
- `msv` (integer) - Monthly search volume  
- `kw_difficulty` (integer) - Keyword difficulty score
- `cpc` (numeric) - Cost per click
- `competition` (varchar) - Competition level
- `search_intent` (varchar) - Search intent classification
- `is_used` (boolean) - Whether keyword is already used
- `opportunity_score` (numeric) - Calculated opportunity score
- `variations_count` (bigint) - Number of keyword variations
- `serp_results_count` (bigint) - SERP results count
- `priority_level` (text) - Priority classification

**content_posts table schema:**
- `id` (uuid) - Primary key
- `blog_id` (uuid) - Foreign key to blogs table
- `title` (varchar) - Post title
- `slug` (varchar) - URL slug
- `content` (text) - Post content
- `status` (varchar) - Publication status
- `wordpress_post_id` (smallint) - WordPress post identifier
- `published_at` (timestamptz) - Publication timestamp
- Additional SEO fields: `seo_title`, `seo_description`, `focus_keyword`

### Current Codebase Structure

```bash
E:\front-blogs\Frontend-Blogs\
├── CLAUDE.md                    # Project instructions and patterns
├── PRPs/
│   ├── templates/
│   │   └── prp_base.md         # PRP template to follow
│   ├── ai_docs/                # Claude Code documentation
│   └── pawa-control-panel-planning-prd.md
├── claude_md_files/
│   └── CLAUDE-NEXTJS-15.md     # Next.js 15 development patterns
└── pyproject.toml              # Project configuration
```

### Desired Project Structure

```bash
pawa-control-panel/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Dashboard layout with navigation
│   │   │   ├── page.tsx                  # Dashboard home
│   │   │   ├── keywords/
│   │   │   │   └── page.tsx              # Keywords management (Server Component)
│   │   │   ├── pipeline/
│   │   │   │   └── page.tsx              # Production pipeline Kanban
│   │   │   └── analytics/
│   │   │       └── page.tsx              # Google Analytics dashboard
│   │   └── api/
│   │       ├── sync/wordpress/
│   │       │   └── route.ts              # WordPress webhook endpoint
│   │       ├── auth/google/
│   │       │   ├── connect/route.ts      # OAuth2 initiation
│   │       │   └── callback/route.ts     # OAuth2 callback
│   │       └── analytics/
│   │           └── route.ts              # Analytics data fetching
│   ├── components/
│   │   ├── ui/                           # Shadcn/ui components
│   │   ├── dashboard/
│   │   │   ├── KeywordsDataTable.tsx     # TanStack Table implementation
│   │   │   ├── AnalyticsChart.tsx        # Recharts visualizations
│   │   │   └── ProductionPipelineKanban.tsx
│   │   └── shared/
│   │       └── SideNav.tsx               # Dashboard navigation
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser Supabase client
│   │   │   └── server.ts                 # Server Supabase client + admin
│   │   ├── google/
│   │   │   └── client.ts                 # Google APIs integration
│   │   ├── utils.ts                      # Utility functions
│   │   └── env.ts                        # Environment validation
│   └── types/
│       └── index.ts                      # TypeScript definitions
├── .env.local                            # Environment variables
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.js                    # Tailwind CSS configuration
└── next.config.js                        # Next.js configuration
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Next.js 14 App Router requires specific client/server patterns
// Server Components: Use createServerClient for data fetching
// Client Components: Use createBrowserClient for user interactions

// GOTCHA: Supabase createServerClient requires cookie handling in App Router
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GOTCHA: TanStack Table v8 requires proper column definitions with accessors
const columns = [
  {
    accessorKey: 'keyword',  // MUST match database column exactly
    header: 'Keyword',
    // Filter functions require proper typing
  }
]

// GOTCHA: WordPress webhook authentication requires Base64 decoding
const authHeader = request.headers.get('authorization')
const [username, password] = Buffer.from(
  authHeader.replace('Basic ', ''), 'base64'
).toString().split(':')

// GOTCHA: Google OAuth2 requires proper PKCE implementation for security
// State parameter MUST be validated to prevent CSRF attacks

// GOTCHA: Environment variables in Next.js App Router
// NEXT_PUBLIC_ prefix required for client-side access
// Server-only variables must be validated with Zod
```

## Implementation Blueprint

### Data Models and Structure

Establish type safety and consistency across the application:

```typescript
// types/index.ts - Core database types
export interface KeywordOpportunity {
  blog_name: string
  keyword: string
  msv: number | null
  kw_difficulty: number | null
  cpc: number | null
  competition: string | null
  search_intent: string | null
  is_used: boolean | null
  opportunity_score: number | null
  variations_count: number | null
  serp_results_count: number | null
  priority_level: string | null
}

export interface ContentPost {
  id: string
  blog_id: string
  title: string
  slug: string | null
  content: string | null
  status: string | null
  wordpress_post_id: number | null
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  focus_keyword: string | null
}

// Zod schemas for validation
export const wordpressWebhookSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.enum(['publish', 'draft', 'private']),
  published_date: z.string(),
  modified_date: z.string(),
  author: z.string(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})
```

### List of Tasks to be Completed

```yaml
Task 1: Initialize Next.js 14 Project Foundation
MODIFY package.json:
  - ADD Next.js 14, React 19, TypeScript dependencies
  - ADD Supabase SSR package, TanStack Table, Recharts
  - ADD Shadcn/ui, Tailwind CSS, and development tools
  - PRESERVE strict TypeScript configuration

CREATE src/lib/env.ts:
  - IMPLEMENT Zod-based environment validation
  - DEFINE server and client environment schemas
  - VALIDATE all required environment variables

CREATE tsconfig.json:
  - FOLLOW CLAUDE-NEXTJS-15.md strict TypeScript requirements
  - ENABLE all strict mode options
  - CONFIGURE path mapping for @/ imports

Task 2: Supabase Integration Setup
CREATE src/lib/supabase/server.ts:
  - IMPLEMENT createServerClient with cookie handling
  - CREATE admin client using service role key
  - FOLLOW Supabase SSR patterns for App Router

CREATE src/lib/supabase/client.ts:
  - IMPLEMENT createBrowserClient for client components
  - HANDLE authentication state changes
  - PROVIDE proper TypeScript typing

CREATE src/types/index.ts:
  - DEFINE KeywordOpportunity interface matching database schema
  - DEFINE ContentPost interface with all database columns
  - CREATE Zod validation schemas for all external data

Task 3: Dashboard Layout and Navigation
CREATE src/app/layout.tsx:
  - IMPLEMENT root layout with metadata and providers
  - CONFIGURE Tailwind CSS and fonts
  - SET up error boundaries

CREATE src/app/(dashboard)/layout.tsx:
  - IMPLEMENT dashboard layout with sidebar navigation
  - INTEGRATE SideNav component
  - HANDLE responsive design for mobile/tablet

CREATE src/components/shared/SideNav.tsx:
  - IMPLEMENT navigation with active state management
  - USE Shadcn/ui components for consistent styling
  - HANDLE navigation icons and accessibility

Task 4: Keywords Data Table Implementation
CREATE src/app/(dashboard)/keywords/page.tsx:
  - IMPLEMENT Server Component for initial data fetching
  - FETCH keyword_opportunities view data using server client
  - PASS initial data to KeywordsDataTable client component

CREATE src/components/dashboard/KeywordsDataTable.tsx:
  - IMPLEMENT TanStack Table v8 with all 12 columns
  - ADD global search filtering across all columns
  - IMPLEMENT column-specific filtering with dropdowns
  - ADD sortable columns with visual indicators
  - IMPLEMENT pagination with customizable page sizes
  - HANDLE loading states and error boundaries

Task 5: WordPress Synchronization API
CREATE src/app/api/sync/wordpress/route.ts:
  - IMPLEMENT POST endpoint for WordPress webhook
  - VALIDATE Basic Authentication with application passwords
  - PARSE and validate WordPress payload with Zod
  - EXECUTE upsert operation to content_posts table
  - IMPLEMENT comprehensive error handling and logging

Task 6: Google OAuth2 Authentication Flow  
CREATE src/app/api/auth/google/connect/route.ts:
  - GENERATE OAuth2 authorization URL with PKCE
  - INCLUDE analytics.readonly and adwords scopes
  - HANDLE state parameter for CSRF protection

CREATE src/app/api/auth/google/callback/route.ts:
  - VALIDATE state parameter and authorization code
  - EXCHANGE code for access and refresh tokens
  - STORE refresh token securely in Supabase
  - REDIRECT to analytics dashboard on success

Task 7: Analytics Dashboard Implementation
CREATE src/app/api/analytics/route.ts:
  - RETRIEVE stored refresh token from database
  - EXCHANGE for fresh access token if expired
  - FETCH Google Analytics data using @google-analytics/data
  - RETURN formatted JSON response with error handling

CREATE src/components/dashboard/AnalyticsChart.tsx:
  - IMPLEMENT Recharts visualization components
  - SUPPORT multiple chart types (line, bar, area)
  - ADD interactive features and data export
  - HANDLE loading states and error conditions

CREATE src/app/(dashboard)/analytics/page.tsx:
  - CHECK Google OAuth2 authentication status
  - DISPLAY connection flow if not authenticated
  - FETCH analytics data and render charts
  - IMPLEMENT date range selection and filtering

Task 8: Production Pipeline Kanban Board
CREATE src/components/dashboard/ProductionPipelineKanban.tsx:
  - IMPLEMENT drag-and-drop Kanban interface
  - FETCH production_pipeline view data
  - HANDLE status updates and task management
  - INTEGRATE with content_posts status changes

Task 9: Security and Testing Implementation
MODIFY all API routes:
  - IMPLEMENT proper input validation with Zod
  - ADD rate limiting and CORS handling
  - SECURE error responses without data leakage

CREATE comprehensive test suites:
  - UNIT tests for all components using Vitest
  - INTEGRATION tests for API routes
  - E2E tests for critical user flows
```

### Per Task Pseudocode

```typescript
// Task 2: Supabase Server Client Setup
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  // PATTERN: App Router cookie handling for SSR
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // GOTCHA: Server actions need try/catch for cookie setting
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle cookie setting errors in middleware
          }
        },
      },
    }
  )
}

// PATTERN: Admin client for privileged operations
export const createAdminClient = () => {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY, // Server-only!
    { cookies: {} }
  )
}

// Task 4: TanStack Table Implementation
// src/components/dashboard/KeywordsDataTable.tsx
'use client'

const KeywordsDataTable = ({ initialData }: Props) => {
  const [data, setData] = useState(initialData)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // PATTERN: Column definitions with proper typing
  const columns: ColumnDef<KeywordOpportunity>[] = [
    {
      accessorKey: 'keyword',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Keyword" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('keyword')}</div>
      ),
    },
    {
      accessorKey: 'opportunity_score', 
      header: 'Opportunity Score',
      cell: ({ row }) => {
        const score = parseFloat(row.getValue('opportunity_score'))
        return (
          <div className={cn(
            'font-medium',
            score > 70 ? 'text-green-600' :
            score > 50 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {score?.toFixed(1)}
          </div>
        )
      },
    },
    // ... other column definitions
  ]

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      columnFilters,
      globalFilter,
    },
  })

  // PATTERN: Render with proper loading and error states
  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          {/* Table implementation with proper accessibility */}
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

// Task 5: WordPress Webhook Handler
// src/app/api/sync/wordpress/route.ts
export async function POST(request: NextRequest) {
  try {
    // PATTERN: Authentication validation
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [username, password] = Buffer.from(
      authHeader.replace('Basic ', ''), 'base64'
    ).toString().split(':')

    if (username !== env.WORDPRESS_BLOG1_APP_USER || 
        password !== env.WORDPRESS_BLOG1_APP_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // PATTERN: Request body validation with Zod
    const rawBody = await request.json()
    const payload = wordpressWebhookSchema.parse(rawBody)

    // PATTERN: Database operations with admin client
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('content_posts')
      .upsert({
        wordpress_post_id: payload.id,
        title: payload.title,
        slug: payload.slug,
        content: payload.content,
        status: payload.status,
        published_at: payload.published_date,
        // Map other fields
      }, {
        onConflict: 'wordpress_post_id,blog_id'
      })

    if (error) {
      console.error('Database upsert failed:', error)
      return NextResponse.json({ 
        error: 'Database operation failed' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Content synchronized successfully' 
    })

  } catch (error) {
    // GOTCHA: Never expose internal errors to client
    console.error('WordPress sync error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
```

### Integration Points

```yaml
DATABASE:
  - table: "keyword_opportunities" (view)
    purpose: "Main data source for keywords data table"
  - table: "content_posts" 
    purpose: "WordPress content synchronization target"
  - table: "production_pipeline" (view)
    purpose: "Kanban board data source"

AUTHENTICATION:
  - Supabase RLS policies for data access control
  - Google OAuth2 for Analytics API access
  - WordPress Application Passwords for webhook auth

EXTERNAL_APIS:
  - Google Analytics Data API v1
  - WordPress REST API webhooks
  - Supabase real-time subscriptions

CONFIG:
  - add to: .env.local
    required: |
      NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
      WORDPRESS_BLOG1_URL=your_wordpress_url
      WORDPRESS_BLOG1_APP_USER=your_app_user
      WORDPRESS_BLOG1_APP_PASSWORD=your_app_password
      GOOGLE_CLIENT_ID=your_google_client_id
      GOOGLE_CLIENT_SECRET=your_google_client_secret
      NEXT_PUBLIC_BASE_URL=http://localhost:3000
      GA_PROPERTY_ID=your_ga_property_id
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run type-check              # TypeScript compilation
npm run lint                    # ESLint with zero warnings
npm run format                  # Prettier formatting

# Expected: No errors. If errors, READ the error message and fix.
# Common issues: Missing imports, incorrect types, unused variables
```

### Level 2: Unit Tests

```bash
# CREATE comprehensive test suites for each major component:

# Test data table functionality
npm run test src/components/dashboard/KeywordsDataTable.test.tsx

# Test API route handlers
npm run test src/app/api/sync/wordpress/route.test.ts
npm run test src/app/api/auth/google/callback/route.test.ts

# Test Supabase integration
npm run test src/lib/supabase/client.test.ts
npm run test src/lib/supabase/server.test.ts

# Expected: All tests passing with >80% coverage
# If failing: Read error, fix root cause, re-run (never mock to pass)
```

### Level 3: Integration Testing

```bash
# Start the development server
npm run dev

# Test keywords data table
curl http://localhost:3000/dashboard/keywords
# Expected: Dashboard loads with keywords table

# Test WordPress webhook endpoint
curl -X POST http://localhost:3000/api/sync/wordpress \
  -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "title": "Test Post",
    "slug": "test-post",
    "content": "Test content",
    "status": "publish",
    "published_date": "2025-01-01T00:00:00Z",
    "modified_date": "2025-01-01T00:00:00Z",
    "author": "Test Author"
  }'
# Expected: {"success": true, "message": "Content synchronized successfully"}

# Test Google OAuth flow
curl http://localhost:3000/api/auth/google/connect
# Expected: Redirect to Google OAuth consent screen
```

### Level 4: Dashboard Functionality Validation

```bash
# Test complete user workflows using MCP Playwright server
npm run test:e2e

# Creative validation methods:
# 1. Performance testing with realistic data loads
npm run test:performance

# 2. Accessibility validation
npm run test:a11y

# 3. Database stress testing
npm run test:db-load

# 4. Security penetration testing
npm run test:security

# 5. Mobile responsiveness validation
npm run test:mobile

# Expected: All validation passes with performance benchmarks met
```

## Final Validation Checklist

- [ ] All tests pass: `npm run test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Keywords table loads with real data from keyword_opportunities view
- [ ] WordPress webhook successfully syncs content to database
- [ ] Google OAuth flow completes and stores tokens securely
- [ ] Analytics dashboard displays charts with Google Analytics data
- [ ] Error cases handled gracefully with user-friendly messages
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] All environment variables validated with Zod schemas
- [ ] Performance targets met: <2s page loads, smooth interactions

---

## Anti-Patterns to Avoid

- ❌ Don't use `any` type - always provide proper TypeScript types
- ❌ Don't skip input validation - all external data must be validated with Zod
- ❌ Don't expose server secrets to client components
- ❌ Don't trust WordPress webhook data without authentication
- ❌ Don't ignore Google API rate limits - implement proper retry logic
- ❌ Don't hardcode database queries - use proper Supabase client methods
- ❌ Don't skip error boundaries - implement comprehensive error handling
- ❌ Don't bypass RLS policies - use proper authentication patterns

**PRP Quality Score: 9/10** - Comprehensive context, executable validation gates, references existing patterns, clear implementation path, and proper error handling documentation. Ready for one-pass implementation success.