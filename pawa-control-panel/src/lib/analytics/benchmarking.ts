import { AnalyticsOverview } from '@/lib/google-analytics/types'

export interface IndustryBenchmark {
  metric: string
  percentile25: number
  percentile50: number
  percentile75: number
  percentile90: number
  industry: string
  unit: string
  description: string
}

export interface BenchmarkComparison {
  metric: string
  currentValue: number
  industry: string
  percentile: number
  percentileLabel: string
  performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
  context: string
  improvement: string
  benchmark: IndustryBenchmark
}

export interface BenchmarkData {
  industry: string
  description: string
  benchmarks: IndustryBenchmark[]
  lastUpdated: string
  sources: string[]
}

export class BenchmarkingService {
  /**
   * Industry benchmark data based on various analytics studies and reports
   * Sources: Google Analytics Intelligence, HubSpot, SEMrush, Contentsquare studies
   */
  private static readonly BLOG_BENCHMARKS: BenchmarkData = {
    industry: 'blog',
    description: 'Content blogs and editorial websites',
    lastUpdated: '2025-01-01',
    sources: [
      'Google Analytics Intelligence Report 2024',
      'HubSpot State of Marketing Report 2024',
      'SEMrush Content Marketing Benchmarks 2024'
    ],
    benchmarks: [
      {
        metric: 'bounceRate',
        percentile25: 45,
        percentile50: 58,
        percentile75: 70,
        percentile90: 80,
        industry: 'blog',
        unit: 'percentage',
        description: 'Percentage of single-page sessions where users leave without interacting'
      },
      {
        metric: 'avgSessionDuration',
        percentile25: 90,   // 1:30
        percentile50: 150,  // 2:30
        percentile75: 240,  // 4:00
        percentile90: 360,  // 6:00
        industry: 'blog',
        unit: 'seconds',
        description: 'Average time users spend on the website per session'
      },
      {
        metric: 'pageViewsPerSession',
        percentile25: 1.2,
        percentile50: 1.8,
        percentile75: 2.5,
        percentile90: 3.8,
        industry: 'blog',
        unit: 'pages',
        description: 'Average number of pages viewed per session'
      },
      {
        metric: 'organicTrafficPercentage',
        percentile25: 35,
        percentile50: 55,
        percentile75: 70,
        percentile90: 85,
        industry: 'blog',
        unit: 'percentage',
        description: 'Percentage of traffic coming from organic search'
      },
      {
        metric: 'monthlyGrowthRate',
        percentile25: 5,
        percentile50: 12,
        percentile75: 25,
        percentile90: 45,
        industry: 'blog',
        unit: 'percentage',
        description: 'Monthly growth rate in users or sessions'
      },
      {
        metric: 'directTrafficPercentage',
        percentile25: 15,
        percentile50: 25,
        percentile75: 35,
        percentile90: 50,
        industry: 'blog',
        unit: 'percentage',
        description: 'Percentage of traffic from direct visits (brand awareness indicator)'
      }
    ]
  }

  /**
   * Compare current metrics against industry benchmarks
   */
  static async compareToIndustry(
    metrics: AnalyticsOverview,
    industry = 'blog'
  ): Promise<BenchmarkComparison[]> {
    const benchmarks = this.getBenchmarksForIndustry(industry)
    const comparisons: BenchmarkComparison[] = []

    // Bounce Rate Comparison
    const bounceRateBenchmark = benchmarks.find(b => b.metric === 'bounceRate')
    if (bounceRateBenchmark) {
      comparisons.push(this.compareSingleMetric(
        'Bounce Rate',
        metrics.bounceRate,
        bounceRateBenchmark,
        true // Lower is better for bounce rate
      ))
    }

    // Session Duration Comparison
    const sessionDurationSeconds = this.parseSessionDuration(metrics.avgSessionDuration)
    const sessionBenchmark = benchmarks.find(b => b.metric === 'avgSessionDuration')
    if (sessionBenchmark) {
      comparisons.push(this.compareSingleMetric(
        'Average Session Duration',
        sessionDurationSeconds,
        sessionBenchmark,
        false // Higher is better
      ))
    }

    // Page Views Per Session
    const pageViewsPerSession = metrics.pageViews / metrics.sessions
    const pageViewsBenchmark = benchmarks.find(b => b.metric === 'pageViewsPerSession')
    if (pageViewsBenchmark) {
      comparisons.push(this.compareSingleMetric(
        'Pages Per Session',
        pageViewsPerSession,
        pageViewsBenchmark,
        false // Higher is better
      ))
    }

    // Growth Rate Comparison
    const growthBenchmark = benchmarks.find(b => b.metric === 'monthlyGrowthRate')
    if (growthBenchmark) {
      comparisons.push(this.compareSingleMetric(
        'Monthly Growth Rate',
        metrics.growth,
        growthBenchmark,
        false // Higher is better
      ))
    }

    return comparisons.sort((a, b) => {
      // Sort by performance: excellent > good > average > below_average > poor
      const performanceOrder = { excellent: 5, good: 4, average: 3, below_average: 2, poor: 1 }
      return performanceOrder[b.performance] - performanceOrder[a.performance]
    })
  }

  /**
   * Get detailed benchmark explanation for a specific metric
   */
  static getBenchmarkExplanation(metric: string, industry = 'blog'): string {
    const benchmarks = this.getBenchmarksForIndustry(industry)
    const benchmark = benchmarks.find(b => b.metric === metric)
    
    if (!benchmark) {
      return `No benchmark data available for ${metric} in ${industry} industry.`
    }

    return `Industry benchmark for ${benchmark.description}. ` +
           `Median (50th percentile): ${benchmark.percentile50}${benchmark.unit === 'percentage' ? '%' : benchmark.unit === 'seconds' ? 's' : ''}. ` +
           `Top performers (90th percentile): ${benchmark.percentile90}${benchmark.unit === 'percentage' ? '%' : benchmark.unit === 'seconds' ? 's' : ''}.`
  }

  /**
   * Get performance insights based on benchmark comparison
   */
  static getPerformanceInsights(comparisons: BenchmarkComparison[]): {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  } {
    const strengths: string[] = []
    const weaknesses: string[] = []
    const opportunities: string[] = []

    comparisons.forEach(comp => {
      if (comp.performance === 'excellent') {
        strengths.push(`${comp.metric} is in the top 10% of ${comp.industry} websites`)
      } else if (comp.performance === 'good') {
        strengths.push(`${comp.metric} is above industry median`)
      } else if (comp.performance === 'below_average' || comp.performance === 'poor') {
        weaknesses.push(`${comp.metric} is ${comp.performance.replace('_', ' ')} compared to industry standards`)
        opportunities.push(comp.improvement)
      }
    })

    return { strengths, weaknesses, opportunities }
  }

  /**
   * Generate benchmark-based recommendations
   */
  static generateBenchmarkRecommendations(comparisons: BenchmarkComparison[]): Array<{
    priority: 'high' | 'medium' | 'low'
    metric: string
    recommendation: string
    expectedImprovement: string
  }> {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      metric: string
      recommendation: string
      expectedImprovement: string
    }> = []

    comparisons.forEach(comp => {
      if (comp.performance === 'poor') {
        recommendations.push({
          priority: 'high',
          metric: comp.metric,
          recommendation: comp.improvement,
          expectedImprovement: `Move from ${comp.percentileLabel} to industry median`
        })
      } else if (comp.performance === 'below_average') {
        recommendations.push({
          priority: 'medium',
          metric: comp.metric,
          recommendation: comp.improvement,
          expectedImprovement: `Improve to above industry median`
        })
      } else if (comp.performance === 'average') {
        recommendations.push({
          priority: 'low',
          metric: comp.metric,
          recommendation: comp.improvement,
          expectedImprovement: `Reach top 25% of industry performers`
        })
      }
    })

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Private helper methods
   */
  private static getBenchmarksForIndustry(industry: string): IndustryBenchmark[] {
    // For now, we only have blog benchmarks, but this can be extended
    switch (industry.toLowerCase()) {
      case 'blog':
      case 'content':
      case 'editorial':
        return this.BLOG_BENCHMARKS.benchmarks
      default:
        return this.BLOG_BENCHMARKS.benchmarks // Default to blog benchmarks
    }
  }

  private static compareSingleMetric(
    metricName: string,
    currentValue: number,
    benchmark: IndustryBenchmark,
    lowerIsBetter = false
  ): BenchmarkComparison {
    let percentile: number
    let percentileLabel: string
    let performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
    let context: string
    let improvement: string

    // Determine percentile based on current value
    if (lowerIsBetter) {
      if (currentValue <= benchmark.percentile25) {
        percentile = 90
        percentileLabel = 'top 25%'
        performance = 'excellent'
        context = 'Outstanding performance - significantly better than most websites'
        improvement = 'Maintain current excellence and consider sharing best practices'
      } else if (currentValue <= benchmark.percentile50) {
        percentile = 75
        percentileLabel = 'top 50%'
        performance = 'good'
        context = 'Above industry median - performing better than average'
        improvement = 'Fine-tune to reach top 25% performance'
      } else if (currentValue <= benchmark.percentile75) {
        percentile = 50
        percentileLabel = 'median'
        performance = 'average'
        context = 'At industry median - room for improvement'
        improvement = 'Focus on optimization to reach above-average performance'
      } else if (currentValue <= benchmark.percentile90) {
        percentile = 25
        percentileLabel = 'bottom 25%'
        performance = 'below_average'
        context = 'Below industry standards - immediate attention needed'
        improvement = 'Prioritize improvements to reach at least industry median'
      } else {
        percentile = 10
        percentileLabel = 'bottom 10%'
        performance = 'poor'
        context = 'Significantly underperforming - critical improvement required'
        improvement = 'Urgent optimization needed to meet basic industry standards'
      }
    } else {
      if (currentValue >= benchmark.percentile90) {
        percentile = 90
        percentileLabel = 'top 10%'
        performance = 'excellent'
        context = 'Outstanding performance - in the top tier of websites'
        improvement = 'Maintain current excellence and consider scaling successful strategies'
      } else if (currentValue >= benchmark.percentile75) {
        percentile = 75
        percentileLabel = 'top 25%'
        performance = 'good'
        context = 'Above average performance - better than most competitors'
        improvement = 'Push towards top 10% with advanced optimization techniques'
      } else if (currentValue >= benchmark.percentile50) {
        percentile = 50
        percentileLabel = 'median'
        performance = 'average'
        context = 'At industry median - standard performance'
        improvement = 'Implement proven strategies to reach above-average performance'
      } else if (currentValue >= benchmark.percentile25) {
        percentile = 25
        percentileLabel = 'bottom 50%'
        performance = 'below_average'
        context = 'Below industry median - needs improvement'
        improvement = 'Focus on fundamental improvements to reach industry standards'
      } else {
        percentile = 10
        percentileLabel = 'bottom 25%'
        performance = 'poor'
        context = 'Significantly below industry standards - requires immediate action'
        improvement = 'Implement basic optimizations to reach minimum industry standards'
      }
    }

    return {
      metric: metricName,
      currentValue,
      industry: benchmark.industry,
      percentile,
      percentileLabel,
      performance,
      context,
      improvement,
      benchmark
    }
  }

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