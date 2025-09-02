import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricTooltip } from '@/components/ui/contextual-tooltip'
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type TrendDirection = 'up' | 'down' | 'neutral'
export type InsightPriority = 'high' | 'medium' | 'low'
export type InsightType = 'positive' | 'warning' | 'neutral' | 'critical'

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: InsightPriority
  impact: string
  effort: string
  implementationSteps?: string[]
  estimatedTime?: string
}

export interface Insight {
  id: string
  type: InsightType
  message: string
  context?: string
  recommendation?: string
  priority: InsightPriority
}

export interface InsightCardProps {
  title: string
  value: string | number
  change?: number
  trend: TrendDirection
  explanation: string
  businessContext?: string
  insights?: Insight[]
  recommendations?: Recommendation[]
  expandable?: boolean
  className?: string
  icon?: React.ReactNode
  benchmark?: string
  learnMoreUrl?: string
}

const getTrendIcon = (trend: TrendDirection, size = 'h-3 w-3') => {
  switch (trend) {
    case 'up':
      return <ArrowUp className={cn(size, 'text-green-600')} />
    case 'down':
      return <ArrowDown className={cn(size, 'text-red-600')} />
    case 'neutral':
    default:
      return <ArrowRight className={cn(size, 'text-gray-500')} />
  }
}

const getTrendColor = (trend: TrendDirection) => {
  switch (trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'neutral':
    default:
      return 'text-gray-500'
  }
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

const getPriorityBadgeVariant = (priority: InsightPriority) => {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'secondary'
    case 'low':
    default:
      return 'outline'
  }
}

const InsightCard = React.forwardRef<HTMLDivElement, InsightCardProps>(
  ({ 
    title, 
    value, 
    change, 
    trend, 
    explanation, 
    businessContext,
    insights = [], 
    recommendations = [], 
    expandable = true,
    className,
    icon,
    benchmark,
    learnMoreUrl,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false)

    const formatValue = (val: string | number) => {
      if (typeof val === 'number') {
        return val.toLocaleString()
      }
      return val
    }

    const triggerElement = (
      <div className="flex items-center gap-2 cursor-help">
        <span className="text-sm font-medium">{title}</span>
        <Info className="h-3 w-3 text-muted-foreground" />
      </div>
    )

    return (
      <Card ref={ref} className={cn('transition-all hover:shadow-lg', className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <MetricTooltip
            metric={title}
            definition={explanation}
            businessContext={businessContext || explanation}
            benchmark={benchmark}
            learnMoreUrl={learnMoreUrl}
            trigger={triggerElement}
          />
          <div className="flex items-center gap-2">
            {icon}
            {expandable && (insights.length > 0 || recommendations.length > 0) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{formatValue(value)}</div>
              {change !== undefined && (
                <p className={cn('text-xs flex items-center gap-1 mt-1', getTrendColor(trend))}>
                  {getTrendIcon(trend)}
                  {change >= 0 ? '+' : ''}{change}% from last month
                </p>
              )}
            </div>
            
            {/* Trend Indicator */}
            <div className="text-right">
              <div className={cn('text-lg font-semibold', getTrendColor(trend))}>
                {getTrendIcon(trend, 'h-5 w-5')}
              </div>
              <p className="text-xs text-muted-foreground">
                {trend === 'up' ? 'Trending Up' : trend === 'down' ? 'Trending Down' : 'Stable'}
              </p>
            </div>
          </div>

          {/* Expandable Section */}
          <AnimatePresence>
            {isExpanded && (insights.length > 0 || recommendations.length > 0) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Insights Section */}
                  {insights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Insights
                      </h4>
                      <div className="space-y-2">
                        {insights.map((insight) => (
                          <div
                            key={insight.id}
                            className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                          >
                            {getInsightIcon(insight.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium">{insight.message}</p>
                                <Badge 
                                  variant={getPriorityBadgeVariant(insight.priority)}
                                  className="text-xs"
                                >
                                  {insight.priority}
                                </Badge>
                              </div>
                              {insight.context && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {insight.context}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations Section */}
                  {recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommendations
                      </h4>
                      <div className="space-y-3">
                        {recommendations.map((recommendation) => (
                          <div
                            key={recommendation.id}
                            className="p-3 rounded-md border bg-card"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="text-sm font-medium">{recommendation.title}</h5>
                                  <Badge 
                                    variant={getPriorityBadgeVariant(recommendation.priority)}
                                    className="text-xs"
                                  >
                                    {recommendation.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {recommendation.description}
                                </p>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span><strong>Impact:</strong> {recommendation.impact}</span>
                                  <span><strong>Effort:</strong> {recommendation.effort}</span>
                                  {recommendation.estimatedTime && (
                                    <span><strong>Time:</strong> {recommendation.estimatedTime}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {recommendation.implementationSteps && recommendation.implementationSteps.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-medium mb-1">Implementation Steps:</p>
                                <ol className="text-xs text-muted-foreground space-y-1 pl-4">
                                  {recommendation.implementationSteps.map((step, index) => (
                                    <li key={index} className="list-decimal">{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    )
  }
)
InsightCard.displayName = 'InsightCard'

export { InsightCard }