import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Info,
  BookOpen,
  Brain,
  Zap,
  User,
  Settings,
  BarChart3,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type ComplexityLevel = 'basic' | 'intermediate' | 'advanced'
export type UserExpertise = 'beginner' | 'intermediate' | 'expert'

export interface BreadcrumbItem {
  label: string
  level: ComplexityLevel
  active: boolean
}

export interface ProgressiveSectionProps {
  level: ComplexityLevel
  title: string
  summary: string
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  userExpertise?: UserExpertise
  showBreadcrumbs?: boolean
  breadcrumbs?: BreadcrumbItem[]
  onLevelChange?: (level: ComplexityLevel) => void
  icon?: React.ReactNode
  badge?: string
  priority?: 'low' | 'medium' | 'high'
}

const getLevelIcon = (level: ComplexityLevel) => {
  switch (level) {
    case 'basic':
      return <User className="h-4 w-4" />
    case 'intermediate':
      return <Settings className="h-4 w-4" />
    case 'advanced':
      return <Brain className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

const getLevelColor = (level: ComplexityLevel) => {
  switch (level) {
    case 'basic':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'intermediate':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'advanced':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getLevelDescription = (level: ComplexityLevel) => {
  switch (level) {
    case 'basic':
      return 'Essential information for getting started'
    case 'intermediate':
      return 'Detailed insights for better understanding'
    case 'advanced':
      return 'In-depth analysis for expert users'
    default:
      return 'Information section'
  }
}

const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return 'border-l-red-500 bg-red-50'
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-50'
    case 'low':
      return 'border-l-green-500 bg-green-50'
    default:
      return 'border-l-gray-300 bg-gray-50'
  }
}

const shouldAutoExpand = (level: ComplexityLevel, userExpertise: UserExpertise = 'intermediate') => {
  switch (userExpertise) {
    case 'beginner':
      return level === 'basic'
    case 'intermediate':
      return level === 'basic' || level === 'intermediate'
    case 'expert':
      return true
    default:
      return level === 'basic'
  }
}

const ProgressiveSection = React.forwardRef<HTMLDivElement, ProgressiveSectionProps>(
  ({ 
    level, 
    title, 
    summary, 
    children, 
    defaultExpanded,
    className,
    userExpertise = 'intermediate',
    showBreadcrumbs = false,
    breadcrumbs = [],
    onLevelChange,
    icon,
    badge,
    priority,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(() => {
      if (defaultExpanded !== undefined) return defaultExpanded
      return shouldAutoExpand(level, userExpertise)
    })
    
    const [currentLevel, setCurrentLevel] = React.useState<ComplexityLevel>(level)

    const handleLevelChange = (newLevel: ComplexityLevel) => {
      setCurrentLevel(newLevel)
      onLevelChange?.(newLevel)
    }

    const toggleExpansion = () => {
      setIsExpanded(!isExpanded)
    }

    return (
      <Card 
        ref={ref} 
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          priority && `border-l-4 ${getPriorityColor(priority)}`,
          className
        )} 
        {...props}
      >
        <CardHeader className="pb-3">
          {/* Breadcrumbs */}
          {showBreadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.label}>
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  <button
                    onClick={() => handleLevelChange(breadcrumb.level)}
                    className={cn(
                      'hover:text-foreground transition-colors',
                      breadcrumb.active && 'text-foreground font-medium'
                    )}
                  >
                    {breadcrumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className="flex items-center gap-2 mt-1">
                {icon || getLevelIcon(currentLevel)}
                {priority && priority === 'high' && <Zap className="h-3 w-3 text-red-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <CardTitle className="text-base font-semibold">{title}</CardTitle>
                  
                  {/* Level Badge */}
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getLevelColor(currentLevel))}
                  >
                    {currentLevel}
                  </Badge>

                  {/* Custom Badge */}
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>

                {/* Summary */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {summary}
                </p>

                {/* Level Description */}
                <p className="text-xs text-muted-foreground mt-1">
                  {getLevelDescription(currentLevel)}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-2">
              {/* Level Switcher */}
              {onLevelChange && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleLevelChange('basic')}
                    disabled={currentLevel === 'basic'}
                  >
                    <User className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleLevelChange('intermediate')}
                    disabled={currentLevel === 'intermediate'}
                  >
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleLevelChange('advanced')}
                    disabled={currentLevel === 'advanced'}
                  >
                    <Brain className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleExpansion}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  {children}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Footer (when collapsed) */}
        {!isExpanded && (
          <div className="px-6 pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={toggleExpansion}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              View Details
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </Card>
    )
  }
)
ProgressiveSection.displayName = 'ProgressiveSection'

// Helper component for nested progressive sections
export interface NestedProgressiveSectionProps extends Omit<ProgressiveSectionProps, 'showBreadcrumbs' | 'breadcrumbs'> {
  parentLevel?: ComplexityLevel
  depth?: number
}

const NestedProgressiveSection = React.forwardRef<HTMLDivElement, NestedProgressiveSectionProps>(
  ({ parentLevel, depth = 1, className, ...props }, ref) => {
    const nestedClassName = cn(
      'ml-4 border-l-2 border-muted',
      depth > 1 && 'ml-6',
      depth > 2 && 'ml-8',
      className
    )

    return (
      <ProgressiveSection
        ref={ref}
        className={nestedClassName}
        {...props}
      />
    )
  }
)
NestedProgressiveSection.displayName = 'NestedProgressiveSection'

// Progressive Container for multiple sections
export interface ProgressiveContainerProps {
  children: React.ReactNode
  className?: string
  userExpertise?: UserExpertise
  onUserExpertiseChange?: (expertise: UserExpertise) => void
  showExpertiseSelector?: boolean
}

const ProgressiveContainer = React.forwardRef<HTMLDivElement, ProgressiveContainerProps>(
  ({ 
    children, 
    className, 
    userExpertise = 'intermediate', 
    onUserExpertiseChange,
    showExpertiseSelector = false,
    ...props 
  }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {/* User Expertise Selector */}
        {showExpertiseSelector && onUserExpertiseChange && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Content Complexity</h3>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred level of detail
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={userExpertise === 'beginner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUserExpertiseChange('beginner')}
                >
                  <User className="h-3 w-3 mr-1" />
                  Basic
                </Button>
                <Button
                  variant={userExpertise === 'intermediate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUserExpertiseChange('intermediate')}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Standard
                </Button>
                <Button
                  variant={userExpertise === 'expert' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUserExpertiseChange('expert')}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Advanced
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Progressive Content */}
        {children}
      </div>
    )
  }
)
ProgressiveContainer.displayName = 'ProgressiveContainer'

export { ProgressiveSection, NestedProgressiveSection, ProgressiveContainer }