# PAWA Control Panel

A comprehensive SEO and content management dashboard built with Next.js 14, integrating WordPress content synchronization, Google Analytics, and keyword opportunity tracking.

## 🚀 Features

- **📊 Keywords Management**: Advanced data table with filtering, sorting, and pagination
- **📝 Content Synchronization**: Real-time WordPress webhook integration
- **📈 Google Analytics**: OAuth2 integration with comprehensive reporting
- **🔐 Secure Authentication**: Google OAuth2 with PKCE security
- **💾 Supabase Integration**: Real-time database with RLS policies

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Lucide React, TanStack Table v8
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Google OAuth2 with PKCE
- **Analytics**: Google Analytics Data API v4
- **Charts**: Recharts
- **Validation**: Zod
- **Testing**: Vitest, Testing Library

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- WordPress sites with application passwords enabled
- Google Cloud Console project with Analytics API enabled
- Google Analytics 4 property set up

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd pawa-control-panel
npm install
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local with your actual values
nano .env.local
```

### 3. Database Setup

The application uses Supabase MCP for database operations. Required tables:
- `blogs` - WordPress blog configurations
- `users` - Author management
- `content_posts` - Synchronized WordPress content
- `keyword_opportunities` - SEO keyword data
- `oauth_tokens` - Secure Google OAuth token storage

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (dashboard)/       # Dashboard route group
│   │   ├── keywords/      # Keywords management
│   │   ├── content/       # Content management
│   │   └── analytics/     # Analytics dashboard
│   └── api/               # API routes
│       ├── sync/          # WordPress sync endpoints
│       ├── auth/          # OAuth2 endpoints
│       └── analytics/     # Analytics API
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── keywords/         # Keywords-specific components
│   ├── content/          # Content-specific components
│   └── shared/           # Shared components
├── lib/                  # Utilities and configurations
│   ├── google/           # Google APIs integration
│   ├── supabase/         # Supabase client setup
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
```

## 🔐 Authentication & Security

### Google OAuth2 Setup

1. **Google Cloud Console**:
   - Create new project or select existing
   - Enable Google Analytics Reporting API
   - Create OAuth2 credentials (Web application)
   - Add authorized redirect URIs

2. **OAuth2 Flow**:
   - PKCE (Proof Key for Code Exchange) implementation
   - Secure state parameter validation
   - Automatic token refresh mechanism
   - Encrypted token storage in Supabase

### WordPress Integration

1. **Application Passwords**:
   - WordPress Admin > Users > Application Passwords
   - Create password for "PAWA Control Panel"
   - Use generated password (not login password)

2. **Webhook Configuration**:
   ```
   URL: https://yourdomain.com/api/sync/wordpress
   Method: POST
   Authentication: Basic Auth
   Events: post_published, post_updated, post_deleted
   ```

## 📊 API Endpoints

### WordPress Sync
- `POST /api/sync/wordpress` - Receive WordPress webhook data
- `GET /api/sync/wordpress` - API documentation

### Google OAuth2
- `GET /api/auth/google/connect` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback

### Analytics
- `POST /api/analytics` - Fetch Google Analytics data
- `GET /api/analytics` - API documentation

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
npm run format       # Format with Prettier

# Testing
npm run test         # Run tests
npm run validate     # Run type-check, lint, and tests
```

## 🌐 Deployment

### Environment Variables

Ensure all environment variables are set in your deployment platform:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- WordPress: `WORDPRESS_BLOG*_URL`, `WORDPRESS_BLOG*_USERNAME`, `WORDPRESS_BLOG*_PASSWORD`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ANALYTICS_PROPERTY_ID`
- Auth: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### Deployment Checklist

1. ✅ Set production environment variables
2. ✅ Update `NEXTAUTH_URL` to production domain
3. ✅ Add production domain to Google OAuth2 authorized origins
4. ✅ Update WordPress webhook URLs to production endpoints
5. ✅ Verify all HTTPS URLs in production
6. ✅ Test OAuth flow in production environment

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Errors**:
   - Check Google Cloud Console configuration
   - Verify redirect URIs match exactly
   - Ensure Analytics API is enabled

2. **WordPress Sync Issues**:
   - Verify application password (not login password)
   - Check webhook URL accessibility
   - Validate Basic Auth headers

3. **Database Errors**:
   - Ensure all required tables exist
   - Check RLS policies in Supabase
   - Verify service role key permissions

4. **Environment Variables**:
   - Confirm all required variables are set
   - Check for trailing spaces or quotes
   - Verify URL formats (with https://)

## 📝 License

This project is private and proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. For internal team contributions, please:

1. Create a feature branch
2. Make your changes
3. Run `npm run validate` to ensure quality
4. Submit a pull request for review

## 📞 Support

For technical support or questions, please contact the development team.

---

Built with ❤️ using Next.js 14, Supabase, and modern web technologies.