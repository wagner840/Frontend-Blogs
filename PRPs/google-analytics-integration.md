# PRP: Integração Dinâmica do Google Analytics com Dashboard Completo

## Meta Information
**Created**: 2025-01-30  
**Status**: Planning  
**Priority**: High  
**Type**: Feature Development  
**Author**: Claude Code Assistant  

## Goal
Desenvolver uma integração completa e dinâmica com a Google Analytics API para substituir dados mockados por métricas reais dos blogs, incluindo gráficos interativos e análise avançada por blog individual.

## Why
- **Dados Reais**: Eliminar dados mockados e fornecer insights verdadeiros de performance
- **Análise Profunda**: Permitir análise detalhada de cada blog individualmente 
- **Visualização Avançada**: Gráficos interativos para melhor compreensão dos dados
- **Tomada de Decisão**: Dados precisos para estratégias de conteúdo e SEO
- **Automatização**: Atualizações automáticas sem intervenção manual

## What
### Success Criteria
- [ ] Integração autenticada com Google Analytics API
- [ ] Dados reais substituindo todos os valores mockados
- [ ] Filtro funcional por blog individual (Optemil/Einsof7/Todos)
- [ ] Gráficos interativos usando Recharts
- [ ] Métricas avançadas: conversões, funis, segmentação
- [ ] Performance otimizada com cache e lazy loading
- [ ] Tratamento de erros robusto e fallbacks

### User Stories
- **Como gestor de conteúdo**: Quero ver métricas reais de cada blog para entender performance
- **Como analista**: Quero gráficos interativos para identificar tendências e padrões
- **Como estrategista**: Quero comparar performance entre blogs para otimizar recursos

## Context

### Documentation
- [Google Analytics Reporting API v4](https://developers.google.com/analytics/devguides/reporting/core/v4): Core API documentation
- [Google Analytics Data API (GA4)](https://developers.google.com/analytics/devguides/reporting/data/v1): Next-generation API
- [Google Auth Library](https://cloud.google.com/docs/authentication): Service Account authentication
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction): Server-side API implementation
- [Recharts Documentation](https://recharts.org/en-US/): React charting library

### Existing Code Patterns
```typescript
// Current mock data structure in analytics/page.tsx
interface BlogData {
  users: number
  pageViews: number
  avgSession: string
  bounceRate: number
  topPages: Array<{...}>
}

// Existing Supabase integration pattern in lib/supabase/server.ts
const supabase = createServiceClient()
const { data, error } = await supabase.from('table').select()
```

### Gotchas
- **Rate Limits**: GA API tem limites de 100 requests/100 segundos/usuário
- **Authentication**: Service Account precisa ser adicionado como usuário no GA
- **Property IDs**: Cada blog tem Property ID diferente (Optemil: 498674424, Einsof7: 498679524)
- **Quota Management**: Requests custosos - implementar cache agressivo
- **Date Ranges**: GA usa formato YYYY-MM-DD, cuidado com fusos horários
- **Permissions**: Service Account precisa role "Viewer" mínimo
- **Data Freshness**: GA tem delay de ~24h para dados completos

### Current State
- Interface mockada funcionando perfeitamente
- Seletor de blog implementado
- Estrutura de dados bem definida
- Build passando sem erros
- Falta apenas integração com dados reais

### Dependencies
- `googleapis`: ^142.0.0 (Google Analytics API client)
- `google-auth-library`: ^9.14.1 (já instalado)
- `recharts`: ^3.1.2 (já instalado para gráficos)
- Service Account JSON key file
- Environment variables para configuração

### Environment Variables Needed
```env
GOOGLE_SERVICE_ACCOUNT_KEY=base64_encoded_key_file
GOOGLE_ANALYTICS_OPTEMIL_PROPERTY_ID=498674424
GOOGLE_ANALYTICS_EINSOF7_PROPERTY_ID=498679524
GOOGLE_ANALYTICS_CACHE_TTL=3600
```

## Implementation Blueprint

### Phase 1: Google Analytics API Setup
**Duração Estimada**: 2-3 horas

```typescript
// TASK: Create Google Analytics service configuration
// FILE: lib/google-analytics/config.ts
export const GA_CONFIG = {
  credentials: JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!, 'base64').toString()),
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  properties: {
    optemil: process.env.GOOGLE_ANALYTICS_OPTEMIL_PROPERTY_ID,
    einsof7: process.env.GOOGLE_ANALYTICS_EINSOF7_PROPERTY_ID
  }
}
```

**Tasks**:
1. **Setup Authentication**
   - FILES: `lib/google-analytics/auth.ts`
   - OPERATION: Create Google Auth service with Service Account
   - VALIDATE: `await auth.getAccessToken()` returns valid token
   - IF_FAIL: Check service account key and permissions

2. **Create GA Client**
   - FILES: `lib/google-analytics/client.ts`
   - OPERATION: Initialize analyticsreporting client
   - VALIDATE: Client can call `batchGet` method
   - IF_FAIL: Verify API enabled in Google Cloud Console

3. **Environment Configuration**
   - FILES: `.env.local`, `next.config.js`
   - OPERATION: Add GA credentials and property IDs
   - VALIDATE: `process.env.GOOGLE_SERVICE_ACCOUNT_KEY` exists
   - IF_FAIL: Check env file format and Next.js config

### Phase 2: Data Fetching Layer
**Duração Estimada**: 4-5 horas

```typescript
// TASK: Create data fetching functions
// FILE: lib/google-analytics/queries.ts
export async function getOverviewMetrics(propertyId: string, dateRange: DateRange) {
  const request = {
    reportRequests: [{
      viewId: propertyId,
      dateRanges: [dateRange],
      metrics: [
        { expression: 'ga:users' },
        { expression: 'ga:pageviews' },
        { expression: 'ga:avgSessionDuration' },
        { expression: 'ga:bounceRate' }
      ],
      dimensions: [{ name: 'ga:date' }]
    }]
  }
  // Return transformed data matching BlogData interface
}
```

**Tasks**:
4. **Overview Metrics Query**
   - FILES: `lib/google-analytics/queries/overview.ts`
   - OPERATION: Fetch users, pageviews, session duration, bounce rate
   - VALIDATE: Returns data matching current BlogData interface
   - IF_FAIL: Check metric names and property access

5. **Top Pages Query**
   - FILES: `lib/google-analytics/queries/pages.ts`
   - OPERATION: Get most visited pages with titles and URLs
   - VALIDATE: Returns array with title, slug, views
   - IF_FAIL: Verify page title dimension availability

6. **Traffic Sources Query**
   - FILES: `lib/google-analytics/queries/traffic.ts`
   - OPERATION: Analyze organic, direct, social, referral traffic
   - VALIDATE: Percentages sum to ~100%
   - IF_FAIL: Check channel grouping dimensions

7. **Keywords Query**
   - FILES: `lib/google-analytics/queries/keywords.ts`
   - OPERATION: Get search terms, positions from Search Console integration
   - VALIDATE: Returns terms with position and clicks
   - IF_FAIL: May need Search Console API integration

### Phase 3: API Routes
**Duração Estimada**: 3-4 horas

```typescript
// TASK: Create API endpoints for frontend consumption
// FILE: app/api/analytics/[blog]/route.ts
export async function GET(request: NextRequest, { params }: { params: { blog: string } }) {
  const blog = params.blog // 'optemil' | 'einsof7' | 'all'
  const propertyIds = blog === 'all' ? [OPTEMIL_ID, EINSOF7_ID] : [getPropertyId(blog)]
  
  try {
    const [overview, pages, traffic, keywords] = await Promise.all([
      getOverviewMetrics(propertyIds),
      getTopPages(propertyIds),  
      getTrafficSources(propertyIds),
      getKeywords(propertyIds)
    ])
    
    return NextResponse.json({ overview, pages, traffic, keywords })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Tasks**:
8. **Individual Blog Endpoint**
   - FILES: `app/api/analytics/[blog]/route.ts`
   - OPERATION: Return specific blog data (optemil/einsof7)
   - VALIDATE: `curl /api/analytics/optemil` returns valid data
   - IF_FAIL: Check property ID mapping and authentication

9. **Combined Analytics Endpoint**
   - FILES: `app/api/analytics/combined/route.ts`
   - OPERATION: Aggregate data from both blogs
   - VALIDATE: Combined totals match sum of individual blogs
   - IF_FAIL: Check data merging logic and date alignment

10. **Real-time Endpoint**
    - FILES: `app/api/analytics/realtime/route.ts`
    - OPERATION: Current active users and live data
    - VALIDATE: Returns current session data
    - IF_FAIL: Check Real Time Reporting API setup

### Phase 4: Frontend Integration
**Duração Estimada**: 3-4 horas

```typescript
// TASK: Replace mock data with API calls
// FILE: app/(dashboard)/analytics/page.tsx - Transform to use real API

// Before (mock):
const blogsData = { optemil: { users: 28543 }, ... }

// After (real):
const [analyticsData, setAnalyticsData] = useState<BlogData | null>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchAnalytics() {
    try {
      const response = await fetch(`/api/analytics/${selectedBlog}`)
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  fetchAnalytics()
}, [selectedBlog])
```

**Tasks**:
11. **Remove Mock Data**
    - FILES: `app/(dashboard)/analytics/page.tsx`
    - OPERATION: Delete hardcoded blogsData and combinedData
    - VALIDATE: No typescript errors after removal
    - IF_FAIL: Check for remaining mock references
    - ROLLBACK: Git revert specific lines

12. **Add Data Fetching Hooks**
    - FILES: `app/(dashboard)/analytics/page.tsx`
    - OPERATION: Implement useEffect with API calls
    - VALIDATE: Data loads correctly on blog filter change
    - IF_FAIL: Check API endpoint response format
    - ROLLBACK: Restore mock data temporarily

13. **Loading States**
    - FILES: `components/analytics/LoadingState.tsx`
    - OPERATION: Create skeleton loading components
    - VALIDATE: Shows loading during API calls
    - IF_FAIL: Check loading state management
    - ROLLBACK: Remove loading components

14. **Error Handling**
    - FILES: `components/analytics/ErrorState.tsx`
    - OPERATION: Handle API failures gracefully
    - VALIDATE: Shows error message on API failure
    - IF_FAIL: Test error scenarios manually
    - ROLLBACK: Add try-catch around API calls

### Phase 5: Interactive Charts
**Duração Estimada**: 4-5 horas

```typescript
// TASK: Add interactive Recharts components
// FILE: components/analytics/Charts/TrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function TrendChart({ data, metric }: { data: TimeSeriesData[], metric: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={metric} stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Tasks**:
15. **Time Series Charts**
    - FILES: `components/analytics/Charts/TrendChart.tsx`
    - OPERATION: Line charts for users, pageviews over time
    - VALIDATE: Charts render with real data points
    - IF_FAIL: Check data format and Recharts props
    - ROLLBACK: Hide charts section temporarily

16. **Traffic Sources Pie Chart**
    - FILES: `components/analytics/Charts/TrafficPieChart.tsx`
    - OPERATION: Visual breakdown of traffic sources
    - VALIDATE: Pie slices match percentage data
    - IF_FAIL: Verify percentage calculations
    - ROLLBACK: Keep text-only traffic sources

17. **Performance Bar Charts**
    - FILES: `components/analytics/Charts/PerformanceChart.tsx`
    - OPERATION: Compare metrics between blogs
    - VALIDATE: Bars scale correctly with data
    - IF_FAIL: Check data normalization
    - ROLLBACK: Disable comparative view

### Phase 6: Advanced Features
**Duração Estimada**: 3-4 horas

**Tasks**:
18. **Date Range Picker**
    - FILES: `components/analytics/DateRangePicker.tsx`
    - OPERATION: Allow custom date range selection
    - VALIDATE: Data updates when range changes
    - IF_FAIL: Check date format conversion
    - ROLLBACK: Default to last 30 days

19. **Data Export Feature**
    - FILES: `components/analytics/ExportButton.tsx`
    - OPERATION: Export analytics data as CSV/PDF
    - VALIDATE: Generated files contain correct data
    - IF_FAIL: Check file generation library
    - ROLLBACK: Remove export functionality

20. **Cache Implementation**
    - FILES: `lib/cache/analytics.ts`
    - OPERATION: Redis/memory cache for GA API responses
    - VALIDATE: Subsequent requests return cached data
    - IF_FAIL: Check cache configuration
    - ROLLBACK: Direct API calls without cache

## Validation Loop

### Level 1: Syntax & Style
```bash
# ARCHON RESEARCH: Always use mcp__archon__search_code_examples for implementation patterns
# Search for Google Analytics integration examples
archon:search_code_examples(query="Google Analytics API Next.js integration", match_count=3)

# Search for authentication patterns
archon:search_code_examples(query="Google Service Account authentication Node.js", match_count=3)

# Lint and type check
npm run lint
npm run type-check
```

### Level 2: Unit Tests
```bash
# Test Google Analytics client
npm run test lib/google-analytics/client.test.ts

# Test API routes
npm run test app/api/analytics/[blog]/route.test.ts

# Test React components
npm run test components/analytics/Charts/*.test.tsx
```

### Level 3: Integration Tests
```bash
# Test full API flow
curl -X GET http://localhost:3000/api/analytics/optemil

# Test frontend integration
npm run dev
# Navigate to /analytics and verify real data loads

# Test all blog filters
# Select each blog option and verify data changes
```

### Level 4: End-to-End Validation
```bash
# Deploy to staging and test
npm run build
npm run start

# Verify performance
# Check API response times < 2 seconds
# Verify charts render smoothly

# Test error scenarios
# Disable GA API and verify graceful degradation
# Test with invalid property IDs
```

## Additional Context

### Security Considerations
- Service Account key deve ser armazenada de forma segura (environment variable)
- Rate limiting nos endpoints para evitar abuse
- Validação de parâmetros de entrada nos API routes
- CORS adequado se necessário para outros domínios

### Performance Optimizations
- Cache agressivo para dados que mudam pouco (daily metrics)
- Lazy loading dos gráficos para melhor performance inicial  
- Pagination para datasets grandes (top pages)
- Compression de responses da API

### Monitoring & Observability
- Logs estruturados para debugging de issues da API
- Métricas de performance dos endpoints
- Alertas para failures na integração com GA
- Dashboard de health check da integração

### Testing Strategies
- Mock GA API responses para testes unitários
- Test fixtures com dados realistas
- Smoke tests para endpoints críticos
- Visual regression tests para gráficos

### Deployment Considerations
- Service Account key no pipeline de CI/CD
- Environment-specific property IDs
- Gradual rollout com feature flags
- Rollback plan se integração falhar

---

**CRITICAL SUCCESS FACTORS**:
1. **SEMPRE usar mcp__archon__search_code_examples** antes de implementar qualquer padrão
2. **Dados reais substituem 100% dos valores mockados**
3. **Performance mantida** - loading < 3 segundos
4. **Error handling robusto** - fallbacks para todos cenários
5. **Filtros funcionam** - cada blog mostra dados corretos
6. **Gráficos interativos** - visualizações úteis e responsivas

**ARCHON INTEGRATION**: Este PRP deve ser executado usando o sistema Archon MCP para task management, research, e progress tracking. Sempre consultar archon:search_code_examples antes de implementar novos padrões.