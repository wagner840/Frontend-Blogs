import { AnalyticsOverview, BlogAnalyticsData, TrafficSource, Keyword } from '@/lib/google-analytics/types'
import { Insight, Recommendation, InsightPriority, InsightType } from '@/components/analytics/InsightCard'

export interface PerformanceScore {
  overall: number // 0-100
  categories: {
    traffic: number
    engagement: number
    conversion: number
    seo: number
  }
  improvements: string[]
  strengths: string[]
}

export interface HistoricalDataPoint {
  date: string
  metrics: AnalyticsOverview
}

export interface InsightAnalysis {
  insights: Insight[]
  recommendations: Recommendation[]
  performanceScore: PerformanceScore
  trendAnalysis: TrendAnalysis
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable'
  velocity: 'fast' | 'moderate' | 'slow'
  consistency: 'consistent' | 'volatile' | 'erratic'
  predictions: {
    nextMonth: {
      users: number
      pageViews: number
      trend: 'up' | 'down' | 'stable'
    }
  }
}

export class InsightsEngine {
  /**
   * Main analysis entry point - generates comprehensive insights
   */
  static generateAnalysis(
    current: AnalyticsOverview,
    historical: HistoricalDataPoint[] = [],
    trafficSources: TrafficSource[] = [],
    keywords: Keyword[] = []
  ): InsightAnalysis {
    const insights = this.analyzeMetrics(current, historical, trafficSources, keywords)
    const recommendations = this.generateRecommendations(insights, current, trafficSources, keywords)
    const performanceScore = this.calculatePerformanceScore(current, trafficSources, keywords)
    const trendAnalysis = this.analyzeTrends(current, historical)

    return {
      insights,
      recommendations,
      performanceScore,
      trendAnalysis
    }
  }

  /**
   * Analyze current metrics against historical data and industry standards
   */
  static analyzeMetrics(
    data: AnalyticsOverview,
    historical: HistoricalDataPoint[] = [],
    trafficSources: TrafficSource[] = [],
    keywords: Keyword[] = []
  ): Insight[] {
    const insights: Insight[] = []

    // Growth Analysis
    if (data.growth > 25) {
      insights.push({
        id: `growth-exceptional-${Date.now()}`,
        type: 'positive',
        message: 'Exceptional user growth detected',
        context: `${data.growth}% growth is significantly above industry average of 10-15%`,
        recommendation: 'Scale up content production and consider expanding successful content categories',
        priority: 'high'
      })
    } else if (data.growth > 15) {
      insights.push({
        id: `growth-strong-${Date.now()}`,
        type: 'positive', 
        message: 'Strong growth momentum',
        context: `${data.growth}% growth indicates healthy audience expansion`,
        priority: 'medium'
      })
    } else if (data.growth < 0) {
      insights.push({
        id: `growth-decline-${Date.now()}`,
        type: 'warning',
        message: 'User growth declining',
        context: `${Math.abs(data.growth)}% decline requires immediate attention`,
        recommendation: 'Audit content strategy and user acquisition channels',
        priority: 'high'
      })
    }

    // Bounce Rate Analysis
    if (data.bounceRate > 80) {
      insights.push({
        id: `bounce-critical-${Date.now()}`,
        type: 'critical',
        message: 'Critical bounce rate indicates content-audience mismatch',
        context: `${data.bounceRate}% bounce rate is well above healthy benchmark of 50-60%`,
        recommendation: 'Review top exit pages and optimize content relevance and page load speeds',
        priority: 'high'
      })
    } else if (data.bounceRate > 65) {
      insights.push({
        id: `bounce-high-${Date.now()}`,
        type: 'warning',
        message: 'High bounce rate needs attention',
        context: `${data.bounceRate}% suggests users aren\'t finding what they expect`,
        recommendation: 'Improve page titles, meta descriptions, and content introduction sections',
        priority: 'medium'
      })
    } else if (data.bounceRate < 40) {
      insights.push({
        id: `bounce-excellent-${Date.now()}`,
        type: 'positive',
        message: 'Excellent user engagement',
        context: `${data.bounceRate}% bounce rate indicates highly relevant content`,
        priority: 'low'
      })
    }

    // Session Duration Analysis
    const avgSeconds = this.parseSessionDuration(data.avgSessionDuration)
    if (avgSeconds > 300) { // > 5 minutes
      insights.push({
        id: `session-excellent-${Date.now()}`,
        type: 'positive',
        message: 'Exceptional content engagement',
        context: `${data.avgSessionDuration} average session indicates highly engaging content`,
        priority: 'low'
      })
    } else if (avgSeconds < 60) { // < 1 minute
      insights.push({
        id: `session-poor-${Date.now()}`,
        type: 'warning',
        message: 'Low session duration suggests quick exits',
        context: `${data.avgSessionDuration} average may indicate content quality or relevance issues`,
        recommendation: 'Improve content structure, add internal links, and enhance readability',
        priority: 'medium'
      })
    }

    // Traffic Source Analysis
    if (trafficSources.length > 0) {
      const organicSource = trafficSources.find(source => 
        source.name.toLowerCase().includes('organic') || 
        source.name.toLowerCase().includes('search')
      )
      
      if (organicSource && organicSource.percentage > 60) {
        insights.push({
          id: `organic-excellent-${Date.now()}`,
          type: 'positive',
          message: 'Strong organic search presence',
          context: `${organicSource.percentage}% organic traffic indicates excellent SEO performance`,
          priority: 'low'
        })
      } else if (organicSource && organicSource.percentage < 30) {
        insights.push({
          id: `organic-low-${Date.now()}`,
          type: 'warning',
          message: 'Low organic search traffic',
          context: `Only ${organicSource.percentage}% organic traffic suggests SEO improvement opportunities`,
          recommendation: 'Focus on keyword optimization, content SEO, and technical improvements',
          priority: 'high'
        })
      }

      const directSource = trafficSources.find(source => 
        source.name.toLowerCase().includes('direct')
      )
      
      if (directSource && directSource.percentage > 40) {
        insights.push({
          id: `direct-high-${Date.now()}`,
          type: 'positive',
          message: 'Strong brand recognition',
          context: `${directSource.percentage}% direct traffic indicates good brand awareness`,
          priority: 'low'
        })
      }
    }

    // Keyword Performance Analysis
    if (keywords.length > 0) {
      const topKeywords = keywords.filter(k => k.position <= 5)
      const lowPerformingKeywords = keywords.filter(k => k.position > 20)
      
      if (topKeywords.length > 5) {
        insights.push({
          id: `keywords-strong-${Date.now()}`,
          type: 'positive',
          message: 'Strong keyword rankings',
          context: `${topKeywords.length} keywords in top 5 positions shows excellent SEO performance`,
          priority: 'low'
        })
      }

      if (lowPerformingKeywords.length > topKeywords.length * 2) {
        insights.push({
          id: `keywords-opportunity-${Date.now()}`,
          type: 'warning',
          message: 'Keyword optimization opportunities',
          context: `${lowPerformingKeywords.length} keywords ranking below position 20`,
          recommendation: 'Focus on improving content for underperforming keywords',
          priority: 'medium'
        })
      }
    }

    // Page Views vs Users Ratio Analysis
    const pageViewsPerUser = data.pageViews / data.users
    if (pageViewsPerUser > 3) {
      insights.push({
        id: `engagement-high-${Date.now()}`,
        type: 'positive',
        message: 'High content consumption per user',
        context: `${pageViewsPerUser.toFixed(1)} pages per user indicates excellent content discovery`,
        priority: 'low'
      })
    } else if (pageViewsPerUser < 1.5) {
      insights.push({
        id: `engagement-low-${Date.now()}`,
        type: 'warning',
        message: 'Low page views per user',
        context: `${pageViewsPerUser.toFixed(1)} pages per user suggests poor content discovery`,
        recommendation: 'Improve internal linking, add related articles, and enhance navigation',
        priority: 'medium'
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Generate actionable recommendations based on insights
   */
  static generateRecommendations(
    insights: Insight[],
    data: AnalyticsOverview,
    trafficSources: TrafficSource[],
    keywords: Keyword[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // High-impact recommendations based on critical issues
    const criticalInsights = insights.filter(i => i.priority === 'high')
    
    criticalInsights.forEach(insight => {
      if (insight.id.includes('bounce-critical')) {
        recommendations.push({
          id: `rec-bounce-fix-${Date.now()}`,
          title: 'Optimize High-Bounce Content',
          description: 'Reduce bounce rate by improving content relevance and page experience',
          priority: 'high',
          impact: 'High - Could improve engagement by 25-40%',
          effort: 'Medium - 2-3 weeks implementation',
          estimatedTime: '2-3 weeks',
          implementationSteps: [
            'Identify top 10 pages with highest bounce rates',
            'Audit content relevance to search intent',
            'Improve page loading speed (target < 3 seconds)',
            'Enhance content introduction and value proposition',
            'Add internal links to related content',
            'A/B test different content formats and structures'
          ]
        })
      }

      if (insight.id.includes('organic-low')) {
        recommendations.push({
          id: `rec-seo-improvement-${Date.now()}`,
          title: 'SEO Optimization Initiative',
          description: 'Comprehensive SEO improvements to increase organic traffic',
          priority: 'high',
          impact: 'High - Could double organic traffic in 6 months',
          effort: 'High - Ongoing effort required',
          estimatedTime: '3-6 months',
          implementationSteps: [
            'Conduct comprehensive keyword research',
            'Optimize existing content for target keywords',
            'Improve technical SEO (site speed, mobile optimization)',
            'Create content targeting long-tail keywords',
            'Build high-quality backlinks',
            'Implement structured data markup'
          ]
        })
      }

      if (insight.id.includes('growth-decline')) {
        recommendations.push({
          id: `rec-growth-recovery-${Date.now()}`,
          title: 'Growth Recovery Strategy',
          description: 'Multi-channel approach to reverse negative growth trend',
          priority: 'high',
          impact: 'Critical - Essential for business sustainability',
          effort: 'High - Requires immediate attention',
          estimatedTime: '1-2 months',
          implementationSteps: [
            'Analyze traffic loss sources (organic, social, direct)',
            'Audit recent content changes or technical issues',
            'Increase content publishing frequency by 50%',
            'Launch targeted social media campaigns',
            'Re-engage email subscribers with valuable content',
            'Implement referral programs or partnerships'
          ]
        })
      }
    })

    // Medium-priority optimization recommendations
    if (data.bounceRate > 50 && data.bounceRate <= 80) {
      recommendations.push({
        id: `rec-engagement-optimization-${Date.now()}`,
        title: 'User Engagement Enhancement',
        description: 'Improve user engagement metrics through content and UX optimization',
        priority: 'medium',
        impact: 'Medium - 15-25% improvement in engagement metrics',
        effort: 'Medium - 3-4 weeks',
        estimatedTime: '3-4 weeks',
        implementationSteps: [
          'Add compelling calls-to-action within content',
          'Implement related articles recommendations',
          'Improve page loading speed',
          'Optimize for mobile user experience',
          'Add interactive elements (polls, quizzes, comments)'
        ]
      })
    }

    // Content strategy recommendations
    const lowEngagementInsights = insights.filter(i => 
      i.id.includes('session-poor') || i.id.includes('engagement-low')
    )
    
    if (lowEngagementInsights.length > 0) {
      recommendations.push({
        id: `rec-content-strategy-${Date.now()}`,
        title: 'Content Strategy Optimization',
        description: 'Enhance content quality and structure to increase user engagement',
        priority: 'medium',
        impact: 'Medium - Improved user satisfaction and retention',
        effort: 'Medium - Ongoing content improvements',
        estimatedTime: '4-6 weeks',
        implementationSteps: [
          'Audit top-performing vs. low-performing content',
          'Identify content gaps in your niche',
          'Develop content templates for consistency',
          'Add visual elements (images, videos, infographics)',
          'Implement content updates for evergreen articles',
          'Create content series to encourage return visits'
        ]
      })
    }

    // SEO and keyword optimization
    if (keywords.length > 0) {
      const avgPosition = keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length
      if (avgPosition > 15) {
        recommendations.push({
          id: `rec-keyword-optimization-${Date.now()}`,
          title: 'Keyword Ranking Improvement',
          description: 'Target specific keyword improvements for higher search visibility',
          priority: 'medium',
          impact: 'Medium-High - Significant organic traffic increase',
          effort: 'Medium - Systematic keyword optimization',
          estimatedTime: '2-3 months',
          implementationSteps: [
            'Identify keywords ranking between positions 11-20',
            'Create comprehensive content for target keywords',
            'Optimize existing content with keyword integration',
            'Build topic clusters around main keywords',
            'Monitor and adjust based on ranking improvements'
          ]
        })
      }
    }

    // Low-priority optimization recommendations
    if (data.growth >= 0 && data.growth < 15) {
      recommendations.push({
        id: `rec-growth-acceleration-${Date.now()}`,
        title: 'Growth Acceleration Tactics',
        description: 'Implement strategies to accelerate current positive growth trend',
        priority: 'low',
        impact: 'Medium - Accelerate existing growth by 20-30%',
        effort: 'Low-Medium - Strategic initiatives',
        estimatedTime: '6-8 weeks',
        implementationSteps: [
          'Identify and replicate successful content patterns',
          'Expand into related topics and keywords',
          'Implement email newsletter for audience retention',
          'Create shareable content for social media',
          'Consider paid promotion for top-performing content'
        ]
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Calculate comprehensive performance score
   */
  static calculatePerformanceScore(
    data: AnalyticsOverview,
    trafficSources: TrafficSource[] = [],
    keywords: Keyword[] = []
  ): PerformanceScore {
    // Traffic Score (0-100)
    let trafficScore = Math.min(100, (data.growth + 10) * 2.5) // Normalized growth score
    trafficScore = Math.max(0, trafficScore) // Ensure non-negative

    // Engagement Score (0-100)
    const bounceRateScore = Math.max(0, 100 - data.bounceRate) // Lower bounce rate = higher score
    const sessionScore = Math.min(100, this.parseSessionDuration(data.avgSessionDuration) / 3) // Normalized session duration
    const pageViewsPerUserScore = Math.min(100, (data.pageViews / data.users) * 25) // Normalized page views per user
    const engagementScore = (bounceRateScore + sessionScore + pageViewsPerUserScore) / 3

    // SEO Score (0-100)
    let seoScore = 50 // Base score
    if (keywords.length > 0) {
      const topKeywords = keywords.filter(k => k.position <= 10).length
      const keywordScore = Math.min(100, (topKeywords / keywords.length) * 150)
      seoScore = keywordScore
    }

    // Conversion Score (0-100) - Based on traffic quality indicators
    const organicTraffic = trafficSources.find(s => s.name.toLowerCase().includes('organic'))?.percentage || 30
    const directTraffic = trafficSources.find(s => s.name.toLowerCase().includes('direct'))?.percentage || 20
    const conversionScore = Math.min(100, (organicTraffic + directTraffic) * 1.2)

    // Overall Score (weighted average)
    const overall = Math.round(
      (trafficScore * 0.3) + 
      (engagementScore * 0.4) + 
      (seoScore * 0.2) + 
      (conversionScore * 0.1)
    )

    // Generate improvements and strengths
    const improvements: string[] = []
    const strengths: string[] = []

    if (trafficScore < 60) improvements.push('Improve user acquisition strategies')
    else if (trafficScore > 80) strengths.push('Strong traffic growth')

    if (engagementScore < 60) improvements.push('Enhance content engagement and user experience')
    else if (engagementScore > 80) strengths.push('Excellent user engagement metrics')

    if (seoScore < 60) improvements.push('Optimize SEO and keyword rankings')
    else if (seoScore > 80) strengths.push('Strong search engine visibility')

    if (conversionScore < 60) improvements.push('Improve traffic quality and conversion paths')
    else if (conversionScore > 80) strengths.push('High-quality traffic sources')

    return {
      overall,
      categories: {
        traffic: Math.round(trafficScore),
        engagement: Math.round(engagementScore),
        conversion: Math.round(conversionScore),
        seo: Math.round(seoScore)
      },
      improvements,
      strengths
    }
  }

  /**
   * Analyze trends from historical data
   */
  static analyzeTrends(
    current: AnalyticsOverview,
    historical: HistoricalDataPoint[] = []
  ): TrendAnalysis {
    if (historical.length < 2) {
      return {
        direction: current.growth > 0 ? 'improving' : current.growth < 0 ? 'declining' : 'stable',
        velocity: 'moderate',
        consistency: 'consistent',
        predictions: {
          nextMonth: {
            users: Math.round(current.users * (1 + current.growth / 100)),
            pageViews: Math.round(current.pageViews * (1 + current.growth / 100)),
            trend: current.growth > 5 ? 'up' : current.growth < -5 ? 'down' : 'stable'
          }
        }
      }
    }

    // Calculate trend direction from historical data
    const growthRates = historical.slice(-3).map((point, index, arr) => {
      if (index === 0) return 0
      const prev = arr[index - 1].metrics
      const curr = point.metrics
      return ((curr.users - prev.users) / prev.users) * 100
    }).filter(rate => rate !== 0)

    const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
    
    const direction = avgGrowthRate > 2 ? 'improving' : avgGrowthRate < -2 ? 'declining' : 'stable'
    const velocity = Math.abs(avgGrowthRate) > 15 ? 'fast' : Math.abs(avgGrowthRate) > 5 ? 'moderate' : 'slow'
    
    // Calculate consistency (variance in growth rates)
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowthRate, 2), 0) / growthRates.length
    const consistency = variance < 25 ? 'consistent' : variance < 100 ? 'volatile' : 'erratic'

    return {
      direction,
      velocity,
      consistency,
      predictions: {
        nextMonth: {
          users: Math.round(current.users * (1 + avgGrowthRate / 100)),
          pageViews: Math.round(current.pageViews * (1 + avgGrowthRate / 100)),
          trend: avgGrowthRate > 2 ? 'up' : avgGrowthRate < -2 ? 'down' : 'stable'
        }
      }
    }
  }

  /**
   * Helper function to parse session duration string to seconds
   */
  private static parseSessionDuration(duration: string): number {
    const parts = duration.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    }
    return 0
  }
}