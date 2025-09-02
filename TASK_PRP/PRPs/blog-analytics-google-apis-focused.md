# PRP: INTEGRAÇÃO AVANÇADA GOOGLE APIS PARA BLOGS - ANALYTICS COMPLETO

## Meta
**Goal**: Desenvolver integração avançada com APIs Google específicas para blogs (Google Analytics 4, Search Console, PageSpeed Insights) com métricas detalhadas, custom dimensions, insights automáticos e dashboard unificado focado em performance de blogs.

**Success Criteria**:
- ✅ Google Analytics 4 API com custom dimensions e métricas avançadas para blogs
- ✅ Search Console API completo com dados de performance, indexação e sitemaps
- ✅ PageSpeed Insights API para Core Web Vitals e performance monitoring
- ✅ Dashboard unificado com correlações entre SEO, Analytics e Performance
- ✅ Sistema de alertas automáticos para quedas de tráfego e performance
- ✅ Breakdown detalhado por tipo de tráfego (descoberto: paid 22s, referral 7s)
- ✅ Insights automáticos sobre oportunidades de otimização
- ✅ Zero dados mockados - apenas dados reais das APIs

## Por que (Why)
- **Problema Atual**: Dashboard limitado com apenas métricas básicas do GA4
- **Oportunidade Descoberta**: Discrepância entre API (29s) e dashboard (7s) revela falta de breakdown detalhado
- **Necessidade de Negócio**: Blogs precisam de análise profunda de SEO + Performance + Analytics
- **Vantagem Competitiva**: Dashboard unificado combinando dados que normalmente ficam separados
- **ROI Claro**: Identificar exatamente quais tipos de tráfego convertem melhor

## O que (What)

### Comportamento Visível ao Usuário:

1. **Analytics Detalhado por Tipo de Tráfego**
   ```
   Breakdown descoberto na análise:
   - Paid: 602 sessions, 22.27s avg duration, high engagement
   - Referral: 28 sessions, 7.00s avg duration (matches user's GA4 dashboard!)
   - Organic: 2 sessions, 15.35s avg duration, high quality
   - Direct: 6 sessions, 1.58s avg duration, bounce heavy
   ```

2. **Search Console Integration Completa**
   - Performance queries com CTR e posições
   - Indexação status por página
   - Core Web Vitals por URL
   - Sitemap submission status
   - Mobile usability issues

3. **PageSpeed Monitoring Automático**
   - Core Web Vitals tracking diário
   - Performance score history
   - Oportunidades de otimização específicas
   - Comparação mobile vs desktop

4. **Insights Automáticos Específicos para Blogs**
   - "Tráfego referral tem 70% menos engagement - investigar fontes"
   - "Página X perdeu 50% do tráfego organic - verificar indexação"
   - "Core Web Vitals degradaram 20% - URLs específicos listados"

## Contexto Específico para Blogs

### APIs Google Relevantes para Blogs:

1. **Google Analytics 4 API - Métricas Avançadas**
   ```typescript
   // Métricas específicas para blogs descobertas
   const BLOG_METRICS = {
     engagement: ['averageSessionDuration', 'engagementRate', 'bounceRate'],
     content: ['screenPageViews', 'timeOnPage', 'scrollDepth'],
     traffic: ['sessionMedium', 'sessionSource', 'deviceCategory'],
     conversions: ['keyEvents', 'eventCount', 'userEngagementDuration']
   }
   
   // Custom Dimensions relevantes para blogs
   const BLOG_DIMENSIONS = {
     content: ['pageTitle', 'contentGroup1', 'contentGroup2'],
     traffic: ['sessionMedium', 'sessionSource', 'country', 'deviceCategory'],
     behavior: ['landingPage', 'exitPage', 'eventName']
   }
   ```

2. **Search Console API - SEO Completo**
   ```typescript
   const SEARCH_CONSOLE_DATA = {
     performance: {
       queries: 'Top search terms bringing traffic',
       pages: 'Best performing blog posts',
       countries: 'Geographic performance',
       devices: 'Mobile vs desktop performance'
     },
     indexing: {
       status: 'Which pages are indexed',
       issues: 'Crawl errors and issues',
       sitemaps: 'Sitemap submission status'
     }
   }
   ```

3. **PageSpeed Insights API - Performance**
   ```typescript
   const PAGESPEED_MONITORING = {
     coreWebVitals: {
       lcp: 'Largest Contentful Paint',
       fid: 'First Input Delay', 
       cls: 'Cumulative Layout Shift'
     },
     opportunities: 'Specific optimization suggestions',
     diagnostics: 'Performance issues details'
   }
   ```

### Arquitetura Atual (Base Sólida):
```
✅ GA4 Client funcionando com service account
✅ Endpoint /api/analytics/[blog] retornando dados reais
✅ Descoberta do breakdown de tráfego detalhado
✅ Search Console integration básica para keywords
✅ Sistema de cache de 1 hora
✅ Error handling com graceful degradation
```

### Gotchas Específicos para Blogs:

1. **GA4 Data Freshness para Blogs**
   - Real-time data disponível apenas para eventos específicos
   - Most metrics têm delay de 24-48h
   - Custom dimensions podem ter delay adicional
   - **Solução**: Clear disclaimers sobre data freshness

2. **Search Console Rate Limits Restritivos**
   - Apenas 1000 requests/day
   - 3 requests/second maximum
   - Data só disponível para últimos 16 meses
   - **Solução**: Aggressive caching e prioritização de queries

3. **PageSpeed Insights Quota Baixa**
   - Apenas 400 requests/day
   - Rate limit muito restritivo
   - **Solução**: Daily monitoring de páginas prioritárias only

4. **Custom Dimensions Setup**
   - Precisa configurar no GA4 dashboard primeiro
   - 24-48h para aparecer nos reports
   - Limite de 50 custom dimensions por property
   - **Solução**: Pre-configure essential blog dimensions

## Blueprint de Implementação

### FASE 1: GA4 ADVANCED INTEGRATION (Semana 1)

#### Task 1.1: Custom Dimensions e Métricas para Blogs
```typescript
// Criar: src/lib/google-analytics/blog-dimensions.ts
export const BLOG_CUSTOM_DIMENSIONS = {
  content_category: 'customEvent:content_category', // SEO, Tech, etc
  article_author: 'customEvent:article_author',
  word_count: 'customEvent:word_count',
  reading_time: 'customEvent:reading_time',
  content_type: 'customEvent:content_type' // blog_post, landing_page
}

export const BLOG_CUSTOM_METRICS = {
  scroll_depth: 'customEvent:scroll_depth',
  time_to_first_scroll: 'customEvent:time_to_first_scroll',
  social_shares: 'customEvent:social_shares',
  email_signups: 'customEvent:email_signups'
}
```

#### Task 1.2: Traffic Breakdown Detalhado (Baseado na Descoberta)
```typescript
// Expandir: src/lib/google-analytics/queries/ga4-traffic.ts
export async function getDetailedTrafficBreakdown(
  propertyId: string,
  dateRange: DateRange
) {
  // Implementar query detalhada por sessionMedium descoberta na análise
  const breakdown = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [dateRange],
    dimensions: [
      { name: 'sessionMedium' },
      { name: 'sessionSource' },
      { name: 'deviceCategory' }
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'engagementRate' },
      { name: 'keyEvents' }
    ]
  })
  
  // Retornar dados estruturados como descobrimos:
  // paid: 602 sessions, 22.27s, etc.
}
```

#### Task 1.3: Content Performance Analysis
```typescript
// Criar: src/lib/google-analytics/queries/content-analysis.ts
export async function getContentPerformance(
  propertyId: string,
  dateRange: DateRange
) {
  return await client.runReport({
    dimensions: [
      { name: 'pageTitle' },
      { name: 'pagePath' },
      { name: 'contentGroup1' } // Blog category
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'keyEvents' }
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
  })
}
```

### FASE 2: SEARCH CONSOLE INTEGRATION COMPLETA (Semana 2)

#### Task 2.1: Search Performance Completo
```typescript
// Criar: src/lib/search-console/client.ts
export class SearchConsoleClient {
  async getSearchPerformance(siteUrl: string, dateRange: DateRange) {
    return await this.webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dimensions: ['query', 'page', 'country', 'device'],
        rowLimit: 25000
      }
    })
  }
  
  async getIndexingStatus(siteUrl: string) {
    return await this.webmasters.sitemaps.list({ siteUrl })
  }
  
  async getCrawlErrors(siteUrl: string) {
    return await this.webmasters.urlcrawlerrorscounts.query({ siteUrl })
  }
}
```

#### Task 2.2: SEO Opportunities Detection
```typescript
// Criar: src/lib/search-console/queries/seo-opportunities.ts
export async function findSEOOpportunities(siteUrl: string, dateRange: DateRange) {
  const performance = await getSearchPerformance(siteUrl, dateRange)
  
  return {
    lowCTRHighImpressions: performance.rows.filter(row => 
      row.impressions > 1000 && row.ctr < 0.02
    ),
    positionImprovements: performance.rows.filter(row =>
      row.position > 3 && row.position < 10 && row.impressions > 100
    ),
    newKeywordOpportunities: performance.rows.filter(row =>
      row.impressions > 50 && row.clicks === 0
    )
  }
}
```

### FASE 3: PAGESPEED MONITORING (Semana 2)

#### Task 3.1: Core Web Vitals Tracking
```typescript
// Criar: src/lib/pagespeed/client.ts
export class PageSpeedClient {
  private readonly API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY
  
  async analyzeUrl(url: string, strategy: 'mobile' | 'desktop' = 'mobile') {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${this.API_KEY}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`
    )
    return response.json()
  }
  
  async getCoreWebVitals(url: string) {
    const result = await this.analyzeUrl(url)
    return {
      lcp: result.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS,
      fid: result.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS,
      cls: result.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE
    }
  }
}
```

#### Task 3.2: Performance Monitoring Dashboard
```typescript
// Criar: src/lib/pagespeed/monitoring.ts
export async function monitorBlogPerformance(blogUrls: string[]) {
  // Monitor apenas URLs prioritárias devido ao rate limit baixo
  const priorityPages = [
    '/', // Homepage
    '/blog', // Blog index
    // Top 3 performing pages from GA4
  ]
  
  const results = await Promise.all(
    priorityPages.map(async url => {
      const analysis = await pageSpeedClient.analyzeUrl(`${blogDomain}${url}`)
      return {
        url,
        performanceScore: analysis.lighthouseResult.categories.performance.score * 100,
        coreWebVitals: await pageSpeedClient.getCoreWebVitals(`${blogDomain}${url}`),
        opportunities: analysis.lighthouseResult.audits
      }
    })
  )
  
  return results
}
```

### FASE 4: DASHBOARD UNIFICADO (Semana 3)

#### Task 4.1: Unified Analytics Component
```typescript
// Criar: src/components/analytics/unified-blog-dashboard.tsx
export function UnifiedBlogDashboard({ blogId, dateRange }) {
  const { data: ga4Data } = useQuery(['ga4', blogId, dateRange], () =>
    getDetailedTrafficBreakdown(propertyId, dateRange)
  )
  
  const { data: searchConsoleData } = useQuery(['search-console', blogId], () =>
    getSearchPerformance(blogUrl, dateRange)
  )
  
  const { data: pageSpeedData } = useQuery(['pagespeed', blogId], () =>
    monitorBlogPerformance([blogUrl])
  )
  
  return (
    <div className="space-y-6">
      {/* Traffic Breakdown - Mostrar descoberta real */}
      <TrafficBreakdownCards data={ga4Data?.trafficBreakdown} />
      
      {/* SEO Performance */}
      <SearchConsoleMetrics data={searchConsoleData} />
      
      {/* Performance Monitoring */}
      <CoreWebVitalsPanel data={pageSpeedData} />
      
      {/* Automated Insights */}
      <InsightsPanel 
        ga4Data={ga4Data}
        seoData={searchConsoleData}
        performanceData={pageSpeedData}
      />
    </div>
  )
}
```

#### Task 4.2: Traffic Breakdown Component (Baseado na Descoberta)
```typescript
// Criar: src/components/analytics/traffic-breakdown-cards.tsx
export function TrafficBreakdownCards({ data }) {
  const trafficTypes = [
    {
      medium: 'paid',
      sessions: data?.paid?.sessions || 0,
      avgDuration: data?.paid?.avgDuration || '0:00',
      color: 'bg-blue-500',
      insight: data?.paid?.sessions > 500 ? 'High volume paid traffic' : null
    },
    {
      medium: 'referral', 
      sessions: data?.referral?.sessions || 0,
      avgDuration: data?.referral?.avgDuration || '0:00',
      color: 'bg-green-500',
      insight: data?.referral?.avgDuration < 10 ? 'Low engagement - check referral quality' : null
    },
    // ... outros tipos baseados na descoberta real
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {trafficTypes.map(traffic => (
        <Card key={traffic.medium}>
          <CardHeader>
            <h3>{traffic.medium}</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{traffic.sessions}</div>
            <div className="text-sm text-gray-600">Avg: {traffic.avgDuration}</div>
            {traffic.insight && (
              <div className="text-xs text-orange-600 mt-2">{traffic.insight}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### FASE 5: INSIGHTS E ALERTAS (Semana 4)

#### Task 5.1: Automated Blog Insights
```typescript
// Criar: src/lib/insights/blog-insights-engine.ts
export class BlogInsightsEngine {
  generateInsights(ga4Data: any, seoData: any, performanceData: any) {
    const insights = []
    
    // Traffic Quality Insights (baseado na descoberta)
    if (ga4Data.referral.avgDuration < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Referral Engagement',
        description: `Referral traffic has ${ga4Data.referral.avgDuration}s avg duration vs ${ga4Data.paid.avgDuration}s for paid traffic`,
        action: 'Review referral sources quality',
        priority: 'high'
      })
    }
    
    // SEO Opportunities
    const lowCTR = seoData.queries.filter(q => q.impressions > 1000 && q.ctr < 0.02)
    if (lowCTR.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Low CTR Keywords',
        description: `${lowCTR.length} keywords have high impressions but low CTR`,
        action: 'Optimize meta descriptions and titles',
        priority: 'medium'
      })
    }
    
    // Performance Issues
    const slowPages = performanceData.filter(p => p.performanceScore < 70)
    if (slowPages.length > 0) {
      insights.push({
        type: 'error',
        title: 'Performance Issues',
        description: `${slowPages.length} pages have performance scores below 70`,
        action: 'Optimize Core Web Vitals',
        priority: 'high'
      })
    }
    
    return insights
  }
}
```

## Novos Endpoints Focados em Blogs

### GET /api/blog-analytics/unified?blog={blogId}&period={period}
```typescript
{
  trafficBreakdown: {
    paid: { sessions: 602, avgDuration: '22:27', bounceRate: 45.2, keyEvents: 12 },
    referral: { sessions: 28, avgDuration: '7:00', bounceRate: 38.1, keyEvents: 2 },
    organic: { sessions: 2, avgDuration: '15:35', bounceRate: 25.0, keyEvents: 1 },
    direct: { sessions: 6, avgDuration: '1:58', bounceRate: 83.3, keyEvents: 0 }
  },
  contentPerformance: [
    { title: 'Top Blog Post', views: 1748, avgTime: '4:12', bounceRate: 32.1 }
  ],
  seoInsights: {
    topQueries: [...],
    opportunities: [...],
    indexingIssues: [...]
  },
  performanceMetrics: {
    coreWebVitals: { lcp: 2.1, fid: 12, cls: 0.05 },
    pageSpeedScore: 85
  },
  automatedInsights: [
    { type: 'warning', title: 'Low Referral Engagement', ... }
  ]
}
```

### GET /api/blog-analytics/seo-opportunities?blog={blogId}
```typescript
{
  lowCTRKeywords: [
    { query: 'keyword', impressions: 5000, ctr: 0.015, position: 4.2 }
  ],
  positionImprovements: [
    { query: 'another keyword', position: 7.8, impressions: 200, opportunity: 'move to top 5' }
  ],
  newKeywords: [
    { query: 'emerging keyword', impressions: 150, clicks: 0, potential: 'high' }
  ],
  indexingIssues: [
    { url: '/blog/post', issue: 'not indexed', fix: 'submit to search console' }
  ]
}
```

### GET /api/blog-analytics/performance-monitoring?blog={blogId}
```typescript
{
  coreWebVitals: {
    homepage: { lcp: 2.1, fid: 15, cls: 0.08, score: 85 },
    topPost: { lcp: 1.8, fid: 12, cls: 0.05, score: 92 }
  },
  opportunities: [
    { audit: 'unused-css-rules', potential: '1.2s faster', priority: 'high' },
    { audit: 'largest-contentful-paint', potential: '0.8s faster', priority: 'medium' }
  ],
  trends: {
    performanceScore: { current: 85, previous: 82, trend: 'improving' },
    coreWebVitals: { status: 'good', issues: 0 }
  }
}
```

## Validação Focada em Blogs

### Level 1: API Integration Tests
```bash
# Testar cada API individualmente com dados reais dos blogs
npm run test:ga4-blog-integration
npm run test:search-console-integration  
npm run test:pagespeed-integration
```

### Level 2: Data Accuracy Tests
```bash
# Comparar dados com GA4 dashboard real
# Verificar breakdown de tráfego matches análise manual
# Testar Search Console data accuracy
npm run test:data-accuracy
```

### Level 3: Performance Tests
```bash
# Testar rate limiting não quebra aplicação
# Verificar cache funciona corretamente
# Testar graceful degradation quando APIs falham
npm run test:performance
```

### Level 4: Blog-Specific E2E
```bash
npm run dev
# Testar com blogs reais (Optemil, Einsof7)
# Verificar insights automáticos são relevantes
# Testar breakdown de tráfego exibe dados corretos

curl "http://localhost:3002/api/blog-analytics/unified?blog=optemil&period=7d"
curl "http://localhost:3002/api/blog-analytics/seo-opportunities?blog=optemil"
```

Esta PRP corrigida foca especificamente nas APIs Google relevantes para blogs, aproveitando a descoberta do breakdown de tráfego detalhado e criando valor real para análise de performance de blogs.