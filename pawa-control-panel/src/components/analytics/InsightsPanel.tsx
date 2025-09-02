import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ArrowRight,
  Clock,
  Zap,
  Award,
  BarChart3,
  Lightbulb,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressiveSection } from './ProgressiveSection'
import type { Insight, Recommendation, InsightType, InsightPriority } from './InsightCard'
import type { PerformanceScore, TrendAnalysis } from '@/lib/analytics/insights-engine'
import type { BenchmarkComparison } from '@/lib/analytics/benchmarking'

export interface InsightsPanelProps {
  insights: Insight[]
  recommendations: Recommendation[]
  performanceScore: PerformanceScore
  trendAnalysis?: TrendAnalysis
  benchmarkComparisons?: BenchmarkComparison[]
  className?: string
  isLoading?: boolean
  lastUpdated?: string
  onRefresh?: () => void
}

const getInsightIcon = (type: InsightType) => {
  switch (type) {
    case 'positive':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'neutral':
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

const getPriorityColor = (priority: InsightPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

const getScoreIcon = (score: number) => {
  if (score >= 80) return <Award className="h-4 w-4" />
  if (score >= 60) return <TrendingUp className="h-4 w-4" />
  if (score >= 40) return <BarChart3 className="h-4 w-4" />
  return <TrendingDown className="h-4 w-4" />
}

const CircularProgress = ({ score, size = 64, strokeWidth = 6 }: { 
  score: number
  size?: number
  strokeWidth?: number 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted stroke-current opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          className={cn(
            "stroke-current transition-all duration-1000",
            score >= 80 ? "text-green-600" :
            score >= 60 ? "text-yellow-600" :
            score >= 40 ? "text-orange-600" : "text-red-600"
          )}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "text-lg font-bold",
          score >= 80 ? "text-green-600" :
          score >= 60 ? "text-yellow-600" :
          score >= 40 ? "text-orange-600" : "text-red-600"
        )}>
          {score}
        </span>
      </div>
    </div>
  )
}

const InsightsPanel = React.forwardRef<HTMLDivElement, InsightsPanelProps>(
  ({ 
    insights, 
    recommendations, 
    performanceScore, 
    trendAnalysis,
    benchmarkComparisons = [],
    className,
    isLoading = false,
    lastUpdated,
    onRefresh,
    ...props 
  }, ref) => {
    const [expandedRecommendation, setExpandedRecommendation] = React.useState<string | null>(null)

    const toggleRecommendation = (id: string) => {
      setExpandedRecommendation(expandedRecommendation === id ? null : id)
    }

    // Sort insights by priority and type
    const sortedInsights = [...insights].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const typeOrder = { critical: 4, warning: 3, positive: 2, neutral: 1 }
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return typeOrder[b.type] - typeOrder[a.type]
    })

    // Sort recommendations by priority
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const highPriorityInsights = sortedInsights.filter(insight => insight.priority === 'high')
    const benchmarkInsights = benchmarkComparisons.filter(comp => 
      comp.performance === 'poor' || comp.performance === 'below_average'
    )

    if (isLoading) {
      return (
        <div ref={ref} className={cn('space-y-6', className)} {...props}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Generating intelligent insights...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('space-y-6', className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Intelligent Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis with actionable recommendations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Performance Score Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Score */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <CircularProgress score={performanceScore.overall} size={80} />
                  <div className="mt-2">
                    <p className="text-sm font-medium">Overall Performance</p>
                    <p className="text-xs text-muted-foreground">
                      {performanceScore.overall >= 80 ? 'Excellent' :
                       performanceScore.overall >= 60 ? 'Good' :
                       performanceScore.overall >= 40 ? 'Average' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                {Object.entries(performanceScore.categories).map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getScoreIcon(score)}
                      <span className="text-sm font-medium capitalize">
                        {category === 'seo' ? 'SEO' : category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-1000",
                            score >= 80 ? "bg-green-600" :
                            score >= 60 ? "bg-yellow-600" :
                            score >= 40 ? "bg-orange-600" : "bg-red-600"
                          )}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-green-700">Strengths</h4>
                <ul className="space-y-1">
                  {performanceScore.strengths.map((strength, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-orange-700">Areas to Improve</h4>
                <ul className="space-y-1">
                  {performanceScore.improvements.map((improvement, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                      <Target className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <ProgressiveSection
          level="basic"
          title="Key Insights"
          summary={`${sortedInsights.length} insights identified, ${highPriorityInsights.length} require immediate attention`}
          icon={<TrendingUp className="h-4 w-4" />}
          priority={highPriorityInsights.length > 0 ? 'high' : 'medium'}
          defaultExpanded={highPriorityInsights.length > 0}
        >
          <div className="space-y-3">
            {sortedInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getPriorityColor(insight.priority))}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  {insight.context && (
                    <p className="text-xs text-muted-foreground">{insight.context}</p>
                  )}
                  {insight.recommendation && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {sortedInsights.length === 0 && (
              <div className="text-center py-6">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No insights available yet</p>
              </div>
            )}
          </div>
        </ProgressiveSection>

        {/* Industry Benchmarks */}
        {benchmarkComparisons.length > 0 && (
          <ProgressiveSection
            level="intermediate"
            title="Industry Benchmarks"
            summary={`Performance comparison against ${benchmarkComparisons.length} industry metrics`}
            icon={<BarChart3 className="h-4 w-4" />}
            priority={benchmarkInsights.length > 0 ? 'medium' : 'low'}
            defaultExpanded={benchmarkInsights.length > 0}
          >
            <div className="space-y-3">
              {benchmarkComparisons.map((comparison, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    comparison.performance === 'excellent' ? 'bg-green-50 border-green-200' :
                    comparison.performance === 'good' ? 'bg-blue-50 border-blue-200' :
                    comparison.performance === 'average' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{comparison.metric}</h4>
                    <Badge variant="outline" className="text-xs">
                      {comparison.percentileLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{comparison.context}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Your value: <strong>{comparison.currentValue}</strong></span>
                    <span className="text-muted-foreground">
                      Industry median: {comparison.benchmark.percentile50}
                    </span>
                  </div>
                  {comparison.improvement && (
                    <p className="text-xs text-blue-600 mt-2 border-t pt-2">
                      💡 {comparison.improvement}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ProgressiveSection>
        )}

        {/* Actionable Recommendations */}
        <ProgressiveSection
          level="intermediate"
          title="Actionable Recommendations"
          summary={`${sortedRecommendations.length} recommendations to improve performance`}
          icon={<Target className="h-4 w-4" />}
          priority={sortedRecommendations.filter(r => r.priority === 'high').length > 0 ? 'high' : 'medium'}
          defaultExpanded={true}
        >
          <div className="space-y-4">
            {sortedRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold">{recommendation.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getPriorityColor(recommendation.priority))}
                      >
                        {recommendation.priority}
                      </Badge>
                      {recommendation.priority === 'high' && (
                        <Zap className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {recommendation.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span><strong>Impact:</strong> {recommendation.impact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span><strong>Effort:</strong> {recommendation.effort}</span>
                      </div>
                      {recommendation.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span><strong>Timeline:</strong> {recommendation.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRecommendation(recommendation.id)}
                    className="flex-shrink-0"
                  >
                    {expandedRecommendation === recommendation.id ? 'Less' : 'More'}
                    <ArrowRight 
                      className={cn(
                        'h-3 w-3 ml-1 transition-transform',
                        expandedRecommendation === recommendation.id && 'rotate-90'
                      )} 
                    />
                  </Button>
                </div>

                {/* Expandable Implementation Steps */}
                <AnimatePresence>
                  {expandedRecommendation === recommendation.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      {recommendation.implementationSteps && recommendation.implementationSteps.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="text-xs font-semibold mb-2">Implementation Steps:</h5>
                          <ol className="space-y-2">
                            {recommendation.implementationSteps.map((step, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs">
                                <span className="flex-shrink-0 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span className="text-muted-foreground">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {sortedRecommendations.length === 0 && (
              <div className="text-center py-6">
                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recommendations available</p>
              </div>
            )}
          </div>
        </ProgressiveSection>

        {/* Trend Analysis */}
        {trendAnalysis && (
          <ProgressiveSection
            level="advanced"
            title="Trend Analysis"
            summary={`${trendAnalysis.direction} trend with ${trendAnalysis.velocity} velocity`}
            icon={<TrendingUp className="h-4 w-4" />}
            priority="low"
            defaultExpanded={false}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-foreground">{trendAnalysis.direction}</div>
                  <div className="text-xs text-muted-foreground">Direction</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-foreground">{trendAnalysis.velocity}</div>
                  <div className="text-xs text-muted-foreground">Velocity</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-foreground">{trendAnalysis.consistency}</div>
                  <div className="text-xs text-muted-foreground">Consistency</div>
                </div>
              </div>

              {trendAnalysis.predictions && trendAnalysis.predictions.nextMonth && (
                <div className="p-3 border rounded-lg bg-muted/50">
                  <h5 className="text-sm font-semibold mb-2">Next Month Predictions</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Users: </span>
                      <span className="font-medium">{trendAnalysis.predictions.nextMonth.users?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Page Views: </span>
                      <span className="font-medium">{trendAnalysis.predictions.nextMonth.pageViews?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ProgressiveSection>
        )}
      </div>
    )
  }
)
InsightsPanel.displayName = 'InsightsPanel'

export { InsightsPanel }