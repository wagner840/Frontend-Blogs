import { getSearchConsoleClient, SearchConsoleQuery, SearchConsolePage } from '../client'
import { DateRange } from '@/lib/google-analytics/types'

export interface SEOOpportunity {
  type: 'low_ctr' | 'position_improvement' | 'new_keyword' | 'declining_keyword'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  query?: string
  page?: string
  currentMetrics: {
    clicks?: number
    impressions?: number
    ctr?: number
    position?: number
  }
  potentialImpact: string
  recommendation: string
}

export interface SEOOpportunitiesSummary {
  totalOpportunities: number
  highPriorityCount: number
  opportunities: SEOOpportunity[]
  summary: {
    lowCTRKeywords: number
    positionImprovements: number
    newKeywords: number
    decliningKeywords: number
  }
}

// URL base do site para mapear oportunidades
const BLOG_DOMAINS = {
  'optemil': 'https://optemil.com',
  'einsof7': 'https://einsof7.com'
}

export async function findSEOOpportunities(
  blogId: 'optemil' | 'einsof7',
  dateRange: DateRange = { startDate: '28daysAgo', endDate: 'yesterday' },
  previousDateRange?: DateRange
): Promise<SEOOpportunitiesSummary> {
  try {
    const siteUrl = BLOG_DOMAINS[blogId]
    const client = getSearchConsoleClient()
    
    // Buscar dados de performance por queries e páginas
    const [queryData, pageData] = await Promise.all([
      client.getSearchPerformance(siteUrl, dateRange, ['query'], 1000),
      client.getSearchPerformance(siteUrl, dateRange, ['page'], 500)
    ])

    const opportunities: SEOOpportunity[] = []

    // 1. Identificar keywords com baixo CTR mas altas impressões
    const lowCTROpportunities = identifyLowCTRKeywords(queryData.queries)
    opportunities.push(...lowCTROpportunities)

    // 2. Identificar oportunidades de melhoria de posição
    const positionOpportunities = identifyPositionImprovements(queryData.queries)
    opportunities.push(...positionOpportunities)

    // 3. Identificar novas keywords (impressões mas sem clicks)
    const newKeywordOpportunities = identifyNewKeywordOpportunities(queryData.queries)
    opportunities.push(...newKeywordOpportunities)

    // 4. Identificar páginas com potencial subaproveitado
    const pageOpportunities = identifyPageOpportunities(pageData.pages)
    opportunities.push(...pageOpportunities)

    // 5. Se houver dados do período anterior, identificar keywords em declínio
    if (previousDateRange) {
      try {
        const previousData = await client.getSearchPerformance(siteUrl, previousDateRange, ['query'], 1000)
        const decliningOpportunities = identifyDecliningKeywords(queryData.queries, previousData.queries)
        opportunities.push(...decliningOpportunities)
      } catch (error) {
        console.warn('Could not fetch previous period data for comparison:', error)
      }
    }

    // Ordenar por prioridade e impacto potencial
    const sortedOpportunities = opportunities.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 }
      return priorityScore[b.priority] - priorityScore[a.priority]
    })

    // Calcular estatísticas de resumo
    const summary = {
      lowCTRKeywords: opportunities.filter(o => o.type === 'low_ctr').length,
      positionImprovements: opportunities.filter(o => o.type === 'position_improvement').length,
      newKeywords: opportunities.filter(o => o.type === 'new_keyword').length,
      decliningKeywords: opportunities.filter(o => o.type === 'declining_keyword').length
    }

    return {
      totalOpportunities: sortedOpportunities.length,
      highPriorityCount: opportunities.filter(o => o.priority === 'high').length,
      opportunities: sortedOpportunities,
      summary
    }

  } catch (error) {
    console.error('Error finding SEO opportunities:', error)
    
    return {
      totalOpportunities: 0,
      highPriorityCount: 0,
      opportunities: [],
      summary: {
        lowCTRKeywords: 0,
        positionImprovements: 0,
        newKeywords: 0,
        decliningKeywords: 0
      }
    }
  }
}

// Identificar keywords com baixo CTR mas alto volume de impressões
function identifyLowCTRKeywords(queries: SearchConsoleQuery[]): SEOOpportunity[] {
  return queries
    .filter(query => 
      query.impressions > 1000 && // Alto volume de impressões
      query.ctr < 2 && // CTR menor que 2%
      query.position < 20 // Posição razoável (primeiras 2 páginas)
    )
    .slice(0, 10) // Limitar a 10 oportunidades principais
    .map(query => ({
      type: 'low_ctr' as const,
      priority: query.impressions > 5000 ? 'high' as const : 'medium' as const,
      title: `Baixo CTR para "${query.query}"`,
      description: `Keyword com ${query.impressions} impressões mas apenas ${query.ctr}% de CTR`,
      query: query.query,
      currentMetrics: {
        clicks: query.clicks,
        impressions: query.impressions,
        ctr: query.ctr,
        position: query.position
      },
      potentialImpact: estimateCTRImprovement(query.impressions, query.ctr),
      recommendation: `Otimize title tag e meta description para melhorar CTR. Posição atual: ${query.position.toFixed(1)}`
    }))
}

// Identificar keywords próximas das primeiras posições
function identifyPositionImprovements(queries: SearchConsoleQuery[]): SEOOpportunity[] {
  return queries
    .filter(query => 
      query.position >= 4 && query.position <= 15 && // Entre posições 4-15
      query.impressions > 100 // Volume mínimo de impressões
    )
    .slice(0, 15)
    .map(query => {
      const targetPosition = query.position > 10 ? 'top 10' : 'top 3'
      const priority = query.position <= 10 && query.impressions > 500 ? 'high' : 
                     query.position <= 15 && query.impressions > 200 ? 'medium' : 'low'
      
      return {
        type: 'position_improvement' as const,
        priority: priority as 'high' | 'medium' | 'low',
        title: `Oportunidade "${query.query}" para ${targetPosition}`,
        description: `Keyword na posição ${query.position.toFixed(1)} com potencial de subir`,
        query: query.query,
        currentMetrics: {
          clicks: query.clicks,
          impressions: query.impressions,
          ctr: query.ctr,
          position: query.position
        },
        potentialImpact: estimatePositionImprovement(query.impressions, query.position),
        recommendation: `Otimize conteúdo e SEO on-page para melhorar ranking. CTR atual: ${query.ctr}%`
      }
    })
}

// Identificar novas oportunidades de keyword
function identifyNewKeywordOpportunities(queries: SearchConsoleQuery[]): SEOOpportunity[] {
  return queries
    .filter(query => 
      query.impressions > 50 && // Volume mínimo
      query.clicks === 0 && // Sem clicks ainda
      query.position < 50 // Posição razoável
    )
    .slice(0, 8)
    .map(query => ({
      type: 'new_keyword' as const,
      priority: query.impressions > 200 ? 'medium' as const : 'low' as const,
      title: `Nova oportunidade: "${query.query}"`,
      description: `${query.impressions} impressões sem clicks - posição ${query.position.toFixed(1)}`,
      query: query.query,
      currentMetrics: {
        clicks: query.clicks,
        impressions: query.impressions,
        ctr: query.ctr,
        position: query.position
      },
      potentialImpact: `Potencial de ${Math.round(query.impressions * 0.02)} clicks mensais`,
      recommendation: 'Crie conteúdo específico ou otimize páginas existentes para esta keyword'
    }))
}

// Identificar páginas com potencial subaproveitado
function identifyPageOpportunities(pages: SearchConsolePage[]): SEOOpportunity[] {
  return pages
    .filter(page => 
      page.impressions > 500 && // Bom volume
      page.ctr < 3 && // CTR baixo
      page.position < 20 // Posição razoável
    )
    .slice(0, 5)
    .map(page => ({
      type: 'low_ctr' as const,
      priority: page.impressions > 2000 ? 'high' as const : 'medium' as const,
      title: `Página com baixo CTR`,
      description: `${page.impressions} impressões mas ${page.ctr}% CTR`,
      page: page.page,
      currentMetrics: {
        clicks: page.clicks,
        impressions: page.impressions,
        ctr: page.ctr,
        position: page.position
      },
      potentialImpact: estimateCTRImprovement(page.impressions, page.ctr),
      recommendation: 'Otimize title, meta description e estrutura da página'
    }))
}

// Identificar keywords em declínio (comparação com período anterior)
function identifyDecliningKeywords(
  currentQueries: SearchConsoleQuery[], 
  previousQueries: SearchConsoleQuery[]
): SEOOpportunity[] {
  const opportunities: SEOOpportunity[] = []
  
  currentQueries.forEach(currentQuery => {
    const previousQuery = previousQueries.find(q => q.query === currentQuery.query)
    
    if (previousQuery && 
        currentQuery.impressions > 200 && // Volume mínimo
        (currentQuery.clicks < previousQuery.clicks * 0.7 || // 30% menos clicks
         currentQuery.position > previousQuery.position + 2)) { // Posição caiu 2+ posições
      
      opportunities.push({
        type: 'declining_keyword' as const,
        priority: currentQuery.impressions > 1000 ? 'high' as const : 'medium' as const,
        title: `Keyword em declínio: "${currentQuery.query}"`,
        description: `Clicks reduziram de ${previousQuery.clicks} para ${currentQuery.clicks}`,
        query: currentQuery.query,
        currentMetrics: {
          clicks: currentQuery.clicks,
          impressions: currentQuery.impressions,
          ctr: currentQuery.ctr,
          position: currentQuery.position
        },
        potentialImpact: `Recuperar ${previousQuery.clicks - currentQuery.clicks} clicks mensais`,
        recommendation: 'Revise e atualize o conteúdo, verifique se há problemas técnicos'
      })
    }
  })
  
  return opportunities.slice(0, 8)
}

// Helpers para estimar impacto
function estimateCTRImprovement(impressions: number, currentCTR: number): string {
  const targetCTR = Math.min(currentCTR * 2, 10) // Dobrar CTR ou máximo 10%
  const additionalClicks = Math.round(impressions * (targetCTR - currentCTR) / 100)
  return `Potencial de +${additionalClicks} clicks mensais melhorando CTR para ${targetCTR.toFixed(1)}%`
}

function estimatePositionImprovement(impressions: number, currentPosition: number): string {
  // Estimativa baseada em CTR médio por posição
  const ctrByPosition = {
    1: 28, 2: 15, 3: 11, 4: 8, 5: 7, 6: 5, 7: 4, 8: 3.5, 9: 3, 10: 2.5
  }
  
  const targetPosition = currentPosition > 10 ? 5 : 2
  const currentCTR = currentPosition <= 10 ? ctrByPosition[Math.round(currentPosition) as keyof typeof ctrByPosition] || 2 : 1
  const targetCTR = ctrByPosition[targetPosition as keyof typeof ctrByPosition]
  
  const additionalClicks = Math.round(impressions * (targetCTR - currentCTR) / 100)
  return `Potencial de +${additionalClicks} clicks mensais subindo para posição ${targetPosition}`
}