import { getGA4Client } from '../ga4-client'
import { BLOG_REPORT_COMBINATIONS } from '../blog-dimensions'
import { DateRange } from '../types'

export interface ContentPerformanceData {
  pageTitle: string
  pagePath: string
  contentCategory?: string
  pageViews: number
  averageSessionDuration: string
  bounceRate: number
  engagementRate: number
  keyEvents: number
  userEngagementDuration: number
  entranceRate?: number
  exitRate?: number
}

export interface ContentAnalysisSummary {
  totalPageViews: number
  topPerformers: ContentPerformanceData[]
  underPerformers: ContentPerformanceData[]
  insights: ContentInsight[]
  categoryBreakdown?: { [category: string]: ContentCategoryStats }
}

export interface ContentCategoryStats {
  totalPageViews: number
  averageBounceRate: number
  averageEngagementRate: number
  postCount: number
}

export interface ContentInsight {
  type: 'success' | 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  affectedPages?: string[]
  recommendation?: string
}

// Função principal para análise de performance de conteúdo
export async function getContentPerformanceAnalysis(
  propertyId: string,
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' },
  limit: number = 25
): Promise<ContentAnalysisSummary> {
  try {
    const client = await getGA4Client().getClient()
    
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' }
      ],
      metrics: BLOG_REPORT_COMBINATIONS.contentPerformance.metrics.map(name => ({ name })),
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true
        }
      ],
      limit: Math.min(limit, 250) // GA4 API limit
    })

    if (!response.rows || response.rows.length === 0) {
      return {
        totalPageViews: 0,
        topPerformers: [],
        underPerformers: [],
        insights: [{
          type: 'warning',
          title: 'Sem Dados de Conteúdo',
          description: 'Nenhum dado de conteúdo encontrado para o período selecionado'
        }]
      }
    }

    // Processar dados da resposta
    const contentData: ContentPerformanceData[] = response.rows
      .map(row => {
        const pageTitle = row.dimensionValues?.[0]?.value || 'Título não disponível'
        const pagePath = row.dimensionValues?.[1]?.value || '/'
        const contentCategory = row.dimensionValues?.[2]?.value || undefined
        
        const pageViews = parseInt(row.metricValues?.[0]?.value || '0')
        const avgDurationSeconds = parseFloat(row.metricValues?.[1]?.value || '0')
        const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100
        const keyEvents = parseInt(row.metricValues?.[3]?.value || '0')
        const userEngagementDuration = parseFloat(row.metricValues?.[4]?.value || '0')
        
        // Calcular engagement rate baseado nos dados disponíveis
        const engagementRate = bounceRate > 0 ? 100 - bounceRate : 0

        return {
          pageTitle: cleanPageTitle(pageTitle),
          pagePath,
          contentCategory,
          pageViews,
          averageSessionDuration: formatSessionDuration(avgDurationSeconds),
          bounceRate: Math.round(bounceRate * 10) / 10,
          engagementRate: Math.round(engagementRate * 10) / 10,
          keyEvents,
          userEngagementDuration: Math.round(userEngagementDuration * 10) / 10
        }
      })
      .filter(item => item.pageViews > 0) // Filtrar páginas sem visualizações

    // Calcular estatísticas gerais
    const totalPageViews = contentData.reduce((sum, item) => sum + item.pageViews, 0)

    // Identificar top performers e underperformers
    const sortedByEngagement = [...contentData].sort((a, b) => b.engagementRate - a.engagementRate)
    const topPerformers = sortedByEngagement.slice(0, Math.min(10, Math.ceil(contentData.length * 0.2)))
    const underPerformers = sortedByEngagement.slice(-Math.min(5, Math.ceil(contentData.length * 0.1)))

    // Análise por categoria se disponível
    const categoryBreakdown = generateCategoryBreakdown(contentData)

    // Gerar insights
    const insights = generateContentInsights(contentData, topPerformers, underPerformers)

    return {
      totalPageViews,
      topPerformers,
      underPerformers,
      insights,
      categoryBreakdown
    }

  } catch (error) {
    console.error('Error fetching content performance analysis:', error)
    
    return {
      totalPageViews: 0,
      topPerformers: [],
      underPerformers: [],
      insights: [{
        type: 'warning',
        title: 'Erro ao Carregar Dados de Conteúdo',
        description: 'Não foi possível analisar a performance do conteúdo. Tente novamente em alguns minutos.'
      }]
    }
  }
}

// Função para obter top posts por categoria
export async function getTopPostsByCategory(
  propertyId: string,
  category: string,
  dateRange: DateRange = { startDate: '30daysAgo', endDate: 'yesterday' },
  limit: number = 10
): Promise<ContentPerformanceData[]> {
  try {
    const client = await getGA4Client().getClient()
    
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'pageTitle' },
        { name: 'pagePath' }
      ],
      metrics: BLOG_REPORT_COMBINATIONS.contentPerformance.metrics.map(name => ({ name })),
      dimensionFilter: {
        filter: {
          fieldName: 'contentGroup1',
          stringFilter: {
            matchType: 'EXACT',
            value: category
          }
        }
      },
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true
        }
      ],
      limit: Math.min(limit, 50)
    })

    if (!response.rows || response.rows.length === 0) {
      return []
    }

    return response.rows.map(row => {
      const pageTitle = row.dimensionValues?.[0]?.value || 'Título não disponível'
      const pagePath = row.dimensionValues?.[1]?.value || '/'
      const contentCategory = row.dimensionValues?.[2]?.value || undefined
      
      const pageViews = parseInt(row.metricValues?.[0]?.value || '0')
      const avgDurationSeconds = parseFloat(row.metricValues?.[1]?.value || '0')
      const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100
      const keyEvents = parseInt(row.metricValues?.[3]?.value || '0')
      const userEngagementDuration = parseFloat(row.metricValues?.[4]?.value || '0')
      
      const engagementRate = bounceRate > 0 ? 100 - bounceRate : 0

      return {
        pageTitle: cleanPageTitle(pageTitle),
        pagePath,
        contentCategory,
        pageViews,
        averageSessionDuration: formatSessionDuration(avgDurationSeconds),
        bounceRate: Math.round(bounceRate * 10) / 10,
        engagementRate: Math.round(engagementRate * 10) / 10,
        keyEvents,
        userEngagementDuration: Math.round(userEngagementDuration * 10) / 10
      }
    })

  } catch (error) {
    console.error('Error fetching top posts by category:', error)
    return []
  }
}

// Função para comparar performance entre períodos
export async function compareContentPerformance(
  propertyId: string,
  currentRange: DateRange,
  previousRange: DateRange
) {
  const [currentData, previousData] = await Promise.all([
    getContentPerformanceAnalysis(propertyId, currentRange),
    getContentPerformanceAnalysis(propertyId, previousRange)
  ])

  return {
    current: currentData,
    previous: previousData,
    changes: calculateContentChanges(currentData.topPerformers, previousData.topPerformers)
  }
}

// Helper functions
function formatSessionDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function cleanPageTitle(title: string): string {
  // Remover sufixos comuns do site
  return title
    .replace(/ - optemil$/, '')
    .replace(/ - einsof7$/, '')
    .replace(/ \| .+$/, '')
    .trim()
}

function generateCategoryBreakdown(
  contentData: ContentPerformanceData[]
): { [category: string]: ContentCategoryStats } | undefined {
  const categoriesWithData = contentData.filter(item => item.contentCategory)
  
  if (categoriesWithData.length === 0) {
    return undefined
  }

  const breakdown: { [category: string]: ContentCategoryStats } = {}

  categoriesWithData.forEach(item => {
    const category = item.contentCategory!
    
    if (!breakdown[category]) {
      breakdown[category] = {
        totalPageViews: 0,
        averageBounceRate: 0,
        averageEngagementRate: 0,
        postCount: 0
      }
    }

    breakdown[category].totalPageViews += item.pageViews
    breakdown[category].averageBounceRate += item.bounceRate
    breakdown[category].averageEngagementRate += item.engagementRate
    breakdown[category].postCount += 1
  })

  // Calcular médias
  Object.keys(breakdown).forEach(category => {
    const stats = breakdown[category]
    stats.averageBounceRate = Math.round((stats.averageBounceRate / stats.postCount) * 10) / 10
    stats.averageEngagementRate = Math.round((stats.averageEngagementRate / stats.postCount) * 10) / 10
  })

  return breakdown
}

function generateContentInsights(
  allContent: ContentPerformanceData[],
  topPerformers: ContentPerformanceData[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _underPerformers: ContentPerformanceData[]
): ContentInsight[] {
  const insights: ContentInsight[] = []

  // Insight 1: Top performer analysis
  if (topPerformers.length > 0) {
    const avgEngagement = topPerformers.reduce((sum, item) => sum + item.engagementRate, 0) / topPerformers.length
    insights.push({
      type: 'success',
      title: 'Top Performers Identificados',
      description: `${topPerformers.length} páginas com alta performance (${avgEngagement.toFixed(1)}% engagement médio)`,
      affectedPages: topPerformers.slice(0, 3).map(p => p.pageTitle),
      recommendation: 'Analise estes posts para identificar padrões de sucesso e replicar em novos conteúdos'
    })
  }

  // Insight 2: High bounce rate content
  const highBounceContent = allContent.filter(item => item.bounceRate > 80)
  if (highBounceContent.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Conteúdo com Alta Taxa de Rejeição',
      description: `${highBounceContent.length} páginas têm bounce rate acima de 80%`,
      affectedPages: highBounceContent.slice(0, 3).map(p => p.pageTitle),
      recommendation: 'Otimize títulos, meta descriptions e qualidade do conteúdo para reduzir bounce rate'
    })
  }

  // Insight 3: Low engagement opportunities  
  const lowEngagementContent = allContent.filter(item => 
    item.pageViews > 100 && item.engagementRate < 20
  )
  if (lowEngagementContent.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Oportunidade de Otimização',
      description: `${lowEngagementContent.length} páginas com bom tráfego mas baixo engagement`,
      affectedPages: lowEngagementContent.slice(0, 3).map(p => p.pageTitle),
      recommendation: 'Melhore o conteúdo interno, adicione CTAs e otimize a experiência do usuário'
    })
  }

  // Insight 4: Content concentration analysis
  const totalViews = allContent.reduce((sum, item) => sum + item.pageViews, 0)
  const top5Views = allContent.slice(0, 5).reduce((sum, item) => sum + item.pageViews, 0)
  const concentration = (top5Views / totalViews) * 100

  if (concentration > 80) {
    insights.push({
      type: 'info',
      title: 'Alta Concentração de Tráfego',
      description: `${concentration.toFixed(1)}% do tráfego vem de apenas 5 páginas`,
      recommendation: 'Considere diversificar o conteúdo e promover outros posts para distribuir melhor o tráfego'
    })
  }

  return insights
}

function calculateContentChanges(
  current: ContentPerformanceData[],
  previous: ContentPerformanceData[]
) {
  return current.map(currentItem => {
    const previousItem = previous.find(p => p.pagePath === currentItem.pagePath)
    
    if (!previousItem) {
      return {
        ...currentItem,
        pageViewsChange: null,
        engagementChange: null
      }
    }

    const pageViewsChange = ((currentItem.pageViews - previousItem.pageViews) / previousItem.pageViews) * 100
    const engagementChange = currentItem.engagementRate - previousItem.engagementRate

    return {
      ...currentItem,
      pageViewsChange: Math.round(pageViewsChange * 10) / 10,
      engagementChange: Math.round(engagementChange * 10) / 10
    }
  })
}