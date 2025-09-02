import { getGA4Client } from '../ga4-client'
import { BLOG_REPORT_COMBINATIONS } from '../blog-dimensions'
import { DateRange } from '../types'

export interface DetailedTrafficBreakdown {
  medium: string
  source: string
  deviceCategory: string
  sessions: number
  averageSessionDuration: string
  bounceRate: number
  engagementRate: number
  keyEvents: number
  percentageOfTotal: number
}

export interface TrafficBreakdownSummary {
  totalSessions: number
  breakdown: DetailedTrafficBreakdown[]
  insights: TrafficInsight[]
}

export interface TrafficInsight {
  type: 'warning' | 'opportunity' | 'info'
  title: string
  description: string
  recommendation?: string
}

// Função principal para obter breakdown detalhado de tráfego
export async function getDetailedTrafficBreakdown(
  propertyId: string,
  dateRange: DateRange = { startDate: '7daysAgo', endDate: 'yesterday' }
): Promise<TrafficBreakdownSummary> {
  try {
    const client = await getGA4Client().getClient()
    
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [dateRange],
      dimensions: BLOG_REPORT_COMBINATIONS.trafficBreakdown.dimensions.map(name => ({ name })),
      metrics: BLOG_REPORT_COMBINATIONS.trafficBreakdown.metrics.map(name => ({ name })),
      orderBys: [
        {
          metric: { metricName: 'sessions' },
          desc: true
        }
      ],
      limit: 50
    })

    if (!response.rows || response.rows.length === 0) {
      return {
        totalSessions: 0,
        breakdown: [],
        insights: [{
          type: 'warning',
          title: 'Sem Dados de Tráfego',
          description: 'Nenhum dado de tráfego encontrado para o período selecionado'
        }]
      }
    }

    // Processar dados da resposta
    const breakdown: DetailedTrafficBreakdown[] = response.rows.map(row => {
      const sessionMedium = row.dimensionValues?.[0]?.value || 'unknown'
      const sessionSource = row.dimensionValues?.[1]?.value || 'unknown'
      const deviceCategory = row.dimensionValues?.[2]?.value || 'unknown'
      
      const sessions = parseInt(row.metricValues?.[0]?.value || '0')
      const avgDurationSeconds = parseFloat(row.metricValues?.[1]?.value || '0')
      const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100
      const engagementRate = parseFloat(row.metricValues?.[3]?.value || '0') * 100
      const keyEvents = parseInt(row.metricValues?.[4]?.value || '0')

      return {
        medium: sessionMedium,
        source: sessionSource,
        deviceCategory,
        sessions,
        averageSessionDuration: formatSessionDuration(avgDurationSeconds),
        bounceRate: Math.round(bounceRate * 10) / 10,
        engagementRate: Math.round(engagementRate * 10) / 10,
        keyEvents,
        percentageOfTotal: 0 // Will be calculated below
      }
    })

    // Calcular total de sessions e percentagens
    const totalSessions = breakdown.reduce((sum, item) => sum + item.sessions, 0)
    breakdown.forEach(item => {
      item.percentageOfTotal = Math.round((item.sessions / totalSessions) * 1000) / 10
    })

    // Gerar insights baseados nos dados
    const insights = generateTrafficInsights(breakdown, totalSessions)

    return {
      totalSessions,
      breakdown,
      insights
    }

  } catch (error) {
    console.error('Error fetching detailed traffic breakdown:', error)
    
    return {
      totalSessions: 0,
      breakdown: [],
      insights: [{
        type: 'warning',
        title: 'Erro ao Carregar Dados',
        description: 'Não foi possível carregar o breakdown de tráfego. Tente novamente em alguns minutos.',
        recommendation: 'Verifique sua conexão e configurações do Google Analytics'
      }]
    }
  }
}

// Função para obter breakdown agrupado por medium (como descobrimos na análise)
export async function getTrafficMediumBreakdown(
  propertyId: string,
  dateRange: DateRange = { startDate: '7daysAgo', endDate: 'yesterday' }
): Promise<{ [medium: string]: DetailedTrafficBreakdown[] }> {
  const data = await getDetailedTrafficBreakdown(propertyId, dateRange)
  
  // Agrupar por medium
  const grouped = data.breakdown.reduce((acc, item) => {
    if (!acc[item.medium]) {
      acc[item.medium] = []
    }
    acc[item.medium].push(item)
    return acc
  }, {} as { [medium: string]: DetailedTrafficBreakdown[] })

  return grouped
}

// Função para comparar com período anterior
export async function compareTrafficBreakdown(
  propertyId: string,
  currentRange: DateRange,
  previousRange: DateRange
) {
  const [currentData, previousData] = await Promise.all([
    getDetailedTrafficBreakdown(propertyId, currentRange),
    getDetailedTrafficBreakdown(propertyId, previousRange)
  ])

  return {
    current: currentData,
    previous: previousData,
    changes: calculateTrafficChanges(currentData.breakdown, previousData.breakdown)
  }
}

// Helper functions
function formatSessionDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function generateTrafficInsights(
  breakdown: DetailedTrafficBreakdown[], 
  totalSessions: number
): TrafficInsight[] {
  const insights: TrafficInsight[] = []

  // Insight 1: Verificar se referral traffic tem baixo engagement (baseado na descoberta)
  const referralTraffic = breakdown.find(item => item.medium === 'referral')
  if (referralTraffic && parseFloat(referralTraffic.averageSessionDuration) < 10) {
    insights.push({
      type: 'warning',
      title: 'Baixo Engagement de Tráfego Referral',
      description: `Tráfego referral tem apenas ${referralTraffic.averageSessionDuration} de duração média vs outras fontes`,
      recommendation: 'Analise as fontes de referral e considere otimizar ou reduzir investimento em fontes de baixa qualidade'
    })
  }

  // Insight 2: Verificar se paid traffic está performando bem
  const paidTraffic = breakdown.filter(item => ['paid', 'cpc', 'ppc'].includes(item.medium.toLowerCase()))
  if (paidTraffic.length > 0) {
    const totalPaidSessions = paidTraffic.reduce((sum, item) => sum + item.sessions, 0)
    const paidPercentage = (totalPaidSessions / totalSessions) * 100
    
    if (paidPercentage > 50) {
      insights.push({
        type: 'info',
        title: 'Alto Volume de Tráfego Pago',
        description: `${paidPercentage.toFixed(1)}% do tráfego vem de fontes pagas`,
        recommendation: 'Monitore ROI e considere diversificar com tráfego orgânico'
      })
    }
  }

  // Insight 3: Verificar diversificação de tráfego
  const organicTraffic = breakdown.find(item => item.medium === 'organic')
  if (!organicTraffic || organicTraffic.sessions < totalSessions * 0.1) {
    insights.push({
      type: 'opportunity',
      title: 'Baixo Tráfego Orgânico',
      description: 'Menos de 10% do tráfego vem de busca orgânica',
      recommendation: 'Invista em SEO para aumentar tráfego orgânico sustentável'
    })
  }

  // Insight 4: Verificar bounce rate alto
  const highBounceTraffic = breakdown.filter(item => item.bounceRate > 80)
  if (highBounceTraffic.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Alta Taxa de Rejeição',
      description: `${highBounceTraffic.length} fontes de tráfego têm bounce rate acima de 80%`,
      recommendation: 'Otimize landing pages e relevância do conteúdo para essas fontes'
    })
  }

  return insights
}

function calculateTrafficChanges(
  current: DetailedTrafficBreakdown[], 
  previous: DetailedTrafficBreakdown[]
) {
  return current.map(currentItem => {
    const previousItem = previous.find(p => 
      p.medium === currentItem.medium && p.source === currentItem.source
    )
    
    if (!previousItem) {
      return {
        ...currentItem,
        sessionsChange: null,
        engagementChange: null
      }
    }

    const sessionsChange = ((currentItem.sessions - previousItem.sessions) / previousItem.sessions) * 100
    const engagementChange = currentItem.engagementRate - previousItem.engagementRate

    return {
      ...currentItem,
      sessionsChange: Math.round(sessionsChange * 10) / 10,
      engagementChange: Math.round(engagementChange * 10) / 10
    }
  })
}