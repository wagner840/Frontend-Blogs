# PRP: INTEGRAÇÃO COMPLETA COM APIS GOOGLE - DASHBOARD ANALYTICS AVANÇADO

## Meta
**Goal**: Desenvolver um dashboard analytics avançado integrando múltiplas APIs do Google (Analytics 4, Search Console, YouTube Analytics, PageSpeed Insights, Google Ads) com métricas reais, insights automáticos e visualizações interativas.

**Success Criteria**:
- ✅ Integração funcional com 5+ APIs Google diferentes
- ✅ Dashboard unificado exibindo métricas combinadas em tempo real
- ✅ Sistema de alertas automáticos baseado em thresholds
- ✅ Filtros avançados por período, tipo de tráfego e fonte de dados
- ✅ Exportação de dados em múltiplos formatos (CSV, PDF, JSON)
- ✅ Performance otimizada com cache inteligente e rate limiting
- ✅ Zero dados mockados - apenas dados reais das APIs

## Por que (Why)
- **Necessidade de Negócio**: Dashboard atual limitado ao GA4 básico, perdendo insights valiosos de outras fontes Google
- **Vantagem Competitiva**: Visão 360° do performance digital combinando SEO, Analytics, Performance e Publicidade
- **Eficiência Operacional**: Centralizar múltiplas fontes de dados em uma interface unificada
- **Insights Automáticos**: Detectar padrões e anomalias automaticamente entre diferentes métricas
- **Escalabilidade**: Base sólida para adicionar novas APIs e funcionalidades no futuro

## O que (What)

### Comportamento Visível ao Usuário:
1. **Dashboard Multi-API Unificado**
   - Cards de métricas combinadas (GA4 + Search Console + PageSpeed)
   - Gráficos interativos com dados de múltiplas fontes
   - Timeline unificada mostrando correlações entre métricas

2. **Sistema de Filtros Avançados**
   - Seletor de período personalizado (7d, 30d, 90d, custom)
   - Filtro por tipo de tráfego (organic, paid, referral, direct)
   - Filtro por fonte de dados (Analytics, Search Console, YouTube, etc.)
   - Comparação entre períodos side-by-side

3. **Alertas e Insights Inteligentes**
   - Notificações automáticas para quedas/picos significativos
   - Detecção de anomalias cross-API
   - Sugestões de otimização baseadas em dados combinados
   - Relatórios automáticos semanais/mensais

4. **Exportação e Relatórios**
   - Export CSV com dados de múltiplas APIs
   - Relatórios PDF com visualizações personalizadas
   - API JSON para integração com outras ferramentas
   - Agendamento de relatórios automáticos

### Requisitos Técnicos:
- Integração com 5+ APIs Google oficiais
- Autenticação OAuth2 centralizada
- Sistema de cache redis para otimização
- Rate limiting inteligente por API
- Background jobs para sincronização
- Error handling robusto com fallbacks
- Logging e monitoring completo

## Contexto Completo

### Documentação APIs Google:
1. **Google Analytics 4 API**
   - URL: https://developers.google.com/analytics/devguides/reporting/data/v1
   - Funcionalidades: Métricas avançadas, dimensões customizadas, funis, coort
   - Rate Limits: 100,000 requests/day, 10 requests/second
   - Autenticação: OAuth2 ou Service Account

2. **Google Search Console API**
   - URL: https://developers.google.com/webmaster-tools/search-console-api-original
   - Funcionalidades: Performance search, indexing status, sitemap data
   - Rate Limits: 1000 requests/day, 3 requests/second
   - Dados: Queries, pages, countries, devices, appearance

3. **YouTube Analytics API**
   - URL: https://developers.google.com/youtube/analytics
   - Funcionalidades: Channel metrics, video metrics, traffic sources
   - Rate Limits: 50,000 requests/day
   - Requisito: YouTube channel vinculado

4. **PageSpeed Insights API**
   - URL: https://developers.google.com/speed/docs/insights/v5/get-started
   - Funcionalidades: Performance scores, Core Web Vitals, suggestions
   - Rate Limits: 400 requests/day
   - Dados: LCP, FID, CLS, FCP metrics

5. **Google Ads API**
   - URL: https://developers.google.com/google-ads/api/docs/start
   - Funcionalidades: Campaign data, keywords, performance metrics
   - Rate Limits: Complex quota system
   - Requisito: Google Ads account access

### Arquitetura Atual (Base para Expansão):
```typescript
// Estrutura atual GA4
export class GA4Client {
  private client: BetaAnalyticsDataClient | null = null
  async getClient(): Promise<BetaAnalyticsDataClient>
  async testConnection(propertyId: string): Promise<boolean>
}

// Endpoint atual
GET /api/analytics/[blog] - Retorna dados básicos GA4
- overview metrics
- top pages 
- traffic sources
- keywords (via Search Console)
```

### Gotchas e Armadilhas Críticas:
1. **Rate Limiting Complexo**
   - Cada API tem limites diferentes
   - YouTube Analytics tem quotas por channel
   - PageSpeed Insights muito restritivo (400/day)
   - Solução: Queue system com backoff exponential

2. **Autenticação Multi-API**
   - Diferentes scopes para cada API
   - Refresh tokens podem expirar
   - Service accounts vs OAuth2 user consent
   - Solução: Token management centralizado

3. **Data Consistency Issues**
   - GA4 data delay (24-48h para alguns dados)
   - Search Console delay (2-3 dias)
   - YouTube metrics podem ter sampling
   - Solução: Clear disclaimers sobre freshness

4. **Cache Strategy Complexa**
   - Diferentes TTL por API e tipo de dado
   - Invalidação inteligente baseada em data ranges
   - Memory vs Redis vs Database cache
   - Solução: Multi-layer caching com TTL dinâmico

5. **Error Handling Multi-API**
   - Falhas parciais em algumas APIs não devem quebrar dashboard
   - Graceful degradation quando APIs estão down
   - Retry logic específico por API
   - Solução: Circuit breaker pattern

### Estado Atual do Sistema:
- ✅ GA4 integration funcionando (29s avg session descoberto)
- ✅ Search Console integration básica para keywords
- ✅ Autenticação via service account
- ✅ Cache de 1 hora implementado
- ✅ Error handling com fallback para mock data
- ❌ Falta integração YouTube, PageSpeed, Ads APIs
- ❌ Falta sistema de alertas
- ❌ Falta filtros avançados na UI
- ❌ Falta export de dados

### Dependências Externas:
```bash
# Packages necessários
npm install @google-analytics/data @google-cloud/monitoring
npm install googleapis youtube-analytics-api
npm install @google-ads/google-ads redis ioredis
npm install node-cron agenda bull-queue
npm install jspdf html2canvas papaparse
```

### Variáveis de Ambiente Necessárias:
```env
# APIs Credentials
GOOGLE_SERVICE_ACCOUNT_KEY=
YOUTUBE_API_KEY=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=

# Cache & Queue
REDIS_URL=
QUEUE_REDIS_URL=

# Rate Limiting
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=1000
```

## Blueprint de Implementação

### FASE 1: EXPANSÃO DAS INTEGRAÇÕES API (Semana 1-2)

#### Task 1.1: YouTube Analytics Integration
```typescript
// Criar: src/lib/youtube-analytics/client.ts
export class YouTubeAnalyticsClient {
  private youtube: youtube_v3.Youtube
  async getChannelMetrics(channelId: string, dateRange: DateRange)
  async getVideoMetrics(videoIds: string[], dateRange: DateRange)
  async getTrafficSources(channelId: string, dateRange: DateRange)
}

// Criar: src/lib/youtube-analytics/queries/overview.ts 
export async function getYouTubeOverview(channelId: string, dateRange: DateRange)
export async function getTopVideos(channelId: string, dateRange: DateRange)
export async function getSubscriberGrowth(channelId: string, dateRange: DateRange)
```

#### Task 1.2: PageSpeed Insights Integration
```typescript
// Criar: src/lib/pagespeed/client.ts
export class PageSpeedClient {
  private apiKey: string
  async analyzeUrl(url: string, strategy: 'mobile' | 'desktop')
  async getCoreWebVitals(url: string)
  async getPerformanceScore(url: string)
}

// Criar: src/lib/pagespeed/queries/performance.ts
export async function getPageSpeedMetrics(urls: string[])
export async function getCoreBitalsHistory(url: string, dateRange: DateRange)
```

#### Task 1.3: Google Ads Integration
```typescript  
// Criar: src/lib/google-ads/client.ts
export class GoogleAdsClient {
  private client: GoogleAdsApi
  async getCampaignMetrics(customerId: string, dateRange: DateRange)
  async getKeywordPerformance(customerId: string, dateRange: DateRange)
  async getAdGroupMetrics(customerId: string, dateRange: DateRange)
}
```

### FASE 2: SISTEMA DE CACHE E RATE LIMITING (Semana 2)

#### Task 2.1: Multi-Layer Cache System
```typescript
// Criar: src/lib/cache/redis-cache.ts
export class RedisCacheManager {
  async get(key: string): Promise<any>
  async set(key: string, value: any, ttl: number): Promise<void>
  async invalidatePattern(pattern: string): Promise<void>
}

// Criar: src/lib/cache/api-cache-strategy.ts
export const API_CACHE_STRATEGIES = {
  'ga4-overview': { ttl: 3600, staleWhileRevalidate: true },
  'search-console': { ttl: 7200, staleWhileRevalidate: false },
  'youtube': { ttl: 1800, staleWhileRevalidate: true },
  'pagespeed': { ttl: 86400, staleWhileRevalidate: false }, // 24h cache
  'google-ads': { ttl: 1800, staleWhileRevalidate: true }
}
```

#### Task 2.2: Rate Limiting System
```typescript
// Criar: src/lib/rate-limiting/rate-limiter.ts
export class APIRateLimiter {
  private redis: Redis
  async checkRateLimit(apiName: string, identifier: string): Promise<boolean>
  async incrementUsage(apiName: string, identifier: string): Promise<void>
  async getRemainingQuota(apiName: string): Promise<number>
}

// Definir limites por API
export const API_RATE_LIMITS = {
  'ga4': { perSecond: 10, perDay: 100000 },
  'search-console': { perSecond: 3, perDay: 1000 },
  'youtube': { perSecond: 5, perDay: 50000 },
  'pagespeed': { perSecond: 1, perDay: 400 },
  'google-ads': { perSecond: 2, perDay: 10000 }
}
```

### FASE 3: DASHBOARD UNIFICADO (Semana 3)

#### Task 3.1: Multi-API Data Aggregation
```typescript
// Criar: src/lib/dashboard/data-aggregator.ts
export class DashboardDataAggregator {
  async getUnifiedOverview(blogId: string, dateRange: DateRange)
  async getCombinedTrafficSources(blogId: string, dateRange: DateRange)
  async getPerformanceCorrelations(blogId: string, dateRange: DateRange)
  async detectAnomalies(blogId: string, dateRange: DateRange)
}

// Criar: src/lib/dashboard/insights-engine.ts
export class InsightsEngine {
  async generateInsights(data: UnifiedDashboardData): Promise<Insight[]>
  async detectPerformanceIssues(data: UnifiedDashboardData): Promise<Alert[]>
  async suggestOptimizations(data: UnifiedDashboardData): Promise<Suggestion[]>
}
```

#### Task 3.2: Advanced UI Components
```typescript
// Criar: src/components/dashboard/unified-dashboard.tsx
export function UnifiedDashboard({ blogId, dateRange }) {
  // Combina dados de todas as APIs
  // Exibe métricas correlacionadas
  // Sistema de alertas em tempo real
}

// Criar: src/components/dashboard/advanced-filters.tsx
export function AdvancedFilters({ onFilterChange }) {
  // Period selector (7d, 30d, 90d, custom)
  // Traffic type filter (organic, paid, referral, direct)
  // Data source toggle (GA4, Search Console, YouTube, etc)
  // Comparison mode (current vs previous period)
}

// Criar: src/components/dashboard/insights-panel.tsx
export function InsightsPanel({ insights, alerts }) {
  // Automated insights display
  // Performance alerts
  // Optimization suggestions
  // Anomaly detection results
}
```

### FASE 4: SISTEMA DE ALERTAS E RELATÓRIOS (Semana 4)

#### Task 4.1: Alert System
```typescript
// Criar: src/lib/alerts/alert-engine.ts
export class AlertEngine {
  async checkThresholds(data: UnifiedDashboardData): Promise<Alert[]>
  async sendNotifications(alerts: Alert[]): Promise<void>
  async manageAlertRules(blogId: string): Promise<AlertRule[]>
}

// Criar: src/lib/alerts/notification-channels.ts
export class NotificationManager {
  async sendEmail(alert: Alert): Promise<void>
  async sendSlack(alert: Alert): Promise<void>
  async sendWebhook(alert: Alert): Promise<void>
}
```

#### Task 4.2: Export and Reporting
```typescript
// Criar: src/lib/export/data-exporter.ts
export class DataExporter {
  async exportToCSV(data: UnifiedDashboardData): Promise<Buffer>
  async exportToPDF(data: UnifiedDashboardData): Promise<Buffer>
  async exportToJSON(data: UnifiedDashboardData): Promise<object>
}

// Criar: src/lib/reports/report-generator.ts
export class ReportGenerator {
  async generateWeeklyReport(blogId: string): Promise<Report>
  async generateMonthlyReport(blogId: string): Promise<Report>
  async scheduleAutomaticReports(config: ReportConfig): Promise<void>
}
```

### FASE 5: BACKGROUND JOBS E SINCRONIZAÇÃO (Semana 4-5)

#### Task 5.1: Job Queue System
```typescript
// Criar: src/lib/jobs/queue-manager.ts
export class JobQueueManager {
  async scheduleDataSync(apiName: string, config: SyncConfig): Promise<void>
  async processDataSyncJob(job: SyncJob): Promise<void>
  async monitorJobHealth(): Promise<JobStatus[]>
}

// Criar: src/lib/jobs/sync-jobs.ts
export const SYNC_JOBS = {
  'ga4-sync': { cron: '0 */6 * * *', priority: 'high' },
  'search-console-sync': { cron: '0 8 * * *', priority: 'medium' },
  'youtube-sync': { cron: '0 */2 * * *', priority: 'high' },
  'pagespeed-sync': { cron: '0 12 * * *', priority: 'low' },
  'google-ads-sync': { cron: '0 */4 * * *', priority: 'high' }
}
```

## Novos Endpoints API

### GET /api/dashboard/unified?blog={blogId}&period={period}
```typescript
// Retorna dados combinados de todas as APIs
{
  overview: {
    ga4: { users, sessions, pageviews, avgDuration, bounceRate },
    searchConsole: { clicks, impressions, ctr, avgPosition },
    youtube: { views, subscribers, watchTime, engagement },
    pageSpeed: { performanceScore, coreWebVitals },
    googleAds: { impressions, clicks, cost, conversions }
  },
  insights: Insight[],
  alerts: Alert[],
  correlations: CorrelationAnalysis[]
}
```

### GET /api/dashboard/traffic-breakdown?blog={blogId}&period={period}
```typescript
// Breakdown detalhado por fonte de tráfego descoberto na análise
{
  trafficSources: [
    { medium: 'paid', sessions: 602, avgDuration: '22.27s', bounce: 45.2 },
    { medium: 'referral', sessions: 28, avgDuration: '7.00s', bounce: 38.1 },
    { medium: 'organic', sessions: 2, avgDuration: '15.35s', bounce: 25.0 }
  ],
  searchConsoleData: { queries, pages, countries },
  youtubeTrafficData: { videoSources, playlistSources }
}
```

### POST /api/alerts/configure
```typescript
// Configurar alertas personalizados
{
  rules: [
    {
      metric: 'ga4.sessions',
      condition: 'decreases_by_percentage',
      threshold: 20,
      period: '7d',
      notifications: ['email', 'slack']
    }
  ]
}
```

### GET /api/export/report?format={csv|pdf|json}&blog={blogId}&period={period}
```typescript
// Exportar dados em diferentes formatos
// CSV: Dados tabulares para Excel/Google Sheets
// PDF: Relatório visual com gráficos
// JSON: Dados estruturados para integração
```

## Validação (4 Níveis)

### Level 1: Syntax & Style
```bash
npm run lint
npm run type-check
npm run format:check
```

### Level 2: Unit Tests
```bash
npm run test:unit
# Testar cada cliente API individualmente
# Testar cache layer com mocks Redis
# Testar rate limiting logic
# Testar data aggregation functions
```

### Level 3: Integration Tests
```bash
npm run test:integration
# Testar fluxo completo de cada API
# Testar sistema de cache end-to-end
# Testar queue jobs com Redis real
# Testar export functions
```

### Level 4: End-to-End Tests
```bash
npm run dev
# Verificar dashboard carrega dados reais de todas as APIs
# Testar filtros avançados funcionam
# Verificar alertas são gerados corretamente
# Testar export de relatórios
# Verificar performance com múltiplas APIs simultâneas

curl -X GET "http://localhost:3002/api/dashboard/unified?blog=optemil&period=7d"
curl -X GET "http://localhost:3002/api/dashboard/traffic-breakdown?blog=optemil&period=30d"
curl -X POST "http://localhost:3002/api/alerts/configure" -H "Content-Type: application/json" -d '{...}'
curl -X GET "http://localhost:3002/api/export/report?format=csv&blog=all&period=30d"
```

## Contexto Adicional

### Considerações de Segurança:
- Service accounts com escopos mínimos necessários
- Rate limiting para prevenir abuse
- Sanitização de dados em exports
- Logging de acesso para auditoria
- Encryption de dados sensíveis no cache

### Estratégias de Performance:
- Parallelização de requests para diferentes APIs
- Connection pooling para Redis
- Lazy loading de dados não críticos
- Progressive data loading na UI
- Background pre-warming de cache

### Monitoring e Observabilidade:
- Métricas de performance por API
- Error rate tracking por endpoint
- Cache hit/miss ratios
- Queue job success/failure rates
- Custom dashboards para health monitoring

### Considerações de Custo:
- PageSpeed Insights tem limite baixo (400/day) - usar estrategicamente
- Google Ads API tem quotas complexas - implementar smart batching
- YouTube Analytics quotas por channel - considerar multi-channel support
- Redis hosting costs - otimizar cache TTL
- Background job processing costs

Este PRP fornece uma base sólida para transformar o dashboard atual em uma plataforma analytics robusta e abrangente, integrando múltiplas fontes de dados Google com insights automáticos e capacidades avançadas de relatórios.