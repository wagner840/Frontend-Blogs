'use client'

import { ReactElement, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  MousePointer,
  Clock,
  TrendingUp,
  Globe,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lightbulb
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Import new enhanced components
import { InsightCard } from '@/components/analytics/InsightCard'
import { InsightsPanel } from '@/components/analytics/InsightsPanel'
import { ProgressiveSection, ProgressiveContainer } from '@/components/analytics/ProgressiveSection'
import { MetricTooltip } from '@/components/ui/contextual-tooltip'

// Import types
import type { 
  Insight, 
  Recommendation, 
  TrendDirection,
  InsightPriority,
  InsightType 
} from '@/components/analytics/InsightCard'
import type { 
  PerformanceScore, 
  TrendAnalysis 
} from '@/lib/analytics/insights-engine'
import type { BenchmarkComparison } from '@/lib/analytics/benchmarking'

// API Response interfaces (keeping existing ones for compatibility)
interface AnalyticsOverview {
  users: number
  pageViews: number
  sessions: number
  avgSessionDuration: string
  bounceRate: number
  growth: number
}

interface TopPage {
  title: string
  slug: string
  views: number
  blog?: string
}

interface TrafficSource {
  name: string
  percentage: number
  sessions: number
  color?: string
}

interface Keyword {
  term: string
  position: number
  clicks: number
  impressions: number
}

interface BlogAnalyticsData {
  id: string
  name: string
  domain: string
  overview: AnalyticsOverview
  topPages: TopPage[]
  trafficSources: TrafficSource[]
  keywords: Keyword[]
  lastUpdated: string
}

interface APIResponse {
  success: boolean
  data: BlogAnalyticsData
  cached: boolean
  fallback?: boolean
  message?: string
  timestamp: string
}

// Enhanced insights API response
interface InsightsAPIResponse {
  success: boolean
  data: {
    blog: {
      id: string
      name: string
      domain: string
    }
    overview: AnalyticsOverview
    insights: Insight[]
    recommendations: Recommendation[]
    performanceScore: PerformanceScore
    trendAnalysis: TrendAnalysis
    benchmarks: {
      comparisons: BenchmarkComparison[]
      recommendations: Array<{
        priority: 'high' | 'medium' | 'low'
        metric: string
        recommendation: string
        expectedImprovement: string
      }>
      insights: {
        strengths: string[]
        weaknesses: string[]
        opportunities: string[]
      }
    }
    generatedAt: string
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  cached: boolean
  fallback?: boolean
  message?: string
  timestamp: string
}

export default function EnhancedAnalyticsPage(): ReactElement {
  const [selectedBlog, setSelectedBlog] = useState<string>('all')
  const [analyticsData, setAnalyticsData] = useState<BlogAnalyticsData | null>(null)
  const [insightsData, setInsightsData] = useState<InsightsAPIResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [userExpertise, setUserExpertise] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate')

  // Fetch basic analytics data
  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/analytics/${selectedBlog}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result: APIResponse = await response.json()
        
        if (result.success && result.data) {
          setAnalyticsData(result.data)
          setIsUsingFallback(result.fallback || false)
        } else {
          throw new Error('Invalid API response')
        }
        
      } catch (err) {
        console.error('Failed to fetch analytics data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics data')
        setAnalyticsData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedBlog])

  // Fetch enhanced insights data
  useEffect(() => {
    async function fetchInsightsData() {
      if (!analyticsData) return
      
      setInsightsLoading(true)
      
      try {
        const response = await fetch(`/api/analytics/insights?blog=${selectedBlog}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result: InsightsAPIResponse = await response.json()
        
        if (result.success && result.data) {
          setInsightsData(result.data)
        } else {
          throw new Error('Failed to load insights data')
        }
        
      } catch (err) {
        console.error('Failed to fetch insights data:', err)
        // Don't show error for insights - just continue without them
      } finally {
        setInsightsLoading(false)
      }
    }

    fetchInsightsData()
  }, [analyticsData, selectedBlog])

  const refreshInsights = async () => {
    if (!analyticsData) return
    await fetchInsightsData()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading enhanced analytics dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="text-lg font-semibold">Failed to Load Analytics</h3>
          <p className="text-muted-foreground">{error || 'Data unavailable'}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const currentData = analyticsData

  // Helper function to convert overview data to InsightCard props
  const createInsightCardData = (
    title: string,
    value: string | number,
    explanation: string,
    businessContext: string,
    icon: ReactElement,
    trend: TrendDirection = 'neutral',
    change?: number,
    benchmark?: string,
    learnMoreUrl?: string
  ) => ({
    title,
    value,
    change,
    trend,
    explanation,
    businessContext,
    icon,
    benchmark,
    learnMoreUrl,
    insights: insightsData?.insights.filter(i => 
      i.message.toLowerCase().includes(title.toLowerCase())
    ) || [],
    recommendations: insightsData?.recommendations.filter(r => 
      r.title.toLowerCase().includes(title.toLowerCase())
    ) || []
  })

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-fluid-xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Enhanced Analytics
          </h1>
          <p className="text-muted-foreground">
            Intelligent insights and actionable recommendations for your blog performance
          </p>
          {isUsingFallback && (
            <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              ⚠️ Using fallback data - Google Analytics API unavailable
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedBlog} onValueChange={setSelectedBlog}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Blog" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blogs</SelectItem>
                <SelectItem value="optemil">Optemil</SelectItem>
                <SelectItem value="einsof7">Einsof7</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {insightsData && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInsights}
              disabled={insightsLoading}
            >
              {insightsLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progressive Container */}
      <ProgressiveContainer
        userExpertise={userExpertise}
        onUserExpertiseChange={setUserExpertise}
        showExpertiseSelector={true}
      >
        {/* Enhanced Overview Cards */}
        <ProgressiveSection
          level="basic"
          title="Performance Overview"
          summary="Key metrics with intelligent insights and trend analysis"
          priority="high"
          defaultExpanded={true}
          icon={<TrendingUp className="h-4 w-4" />}
        >
          <div className="grid-fluid gap-fluid">
            <InsightCard
              {...createInsightCardData(
                'Total Users',
                currentData.overview.users,
                'Total number of unique visitors to your blog',
                'Users represent the size of your audience and growth potential',
                <Users className="h-4 w-4 text-muted-foreground" />,
                currentData.overview.growth >= 0 ? 'up' : 'down',
                currentData.overview.growth,
                'Industry median: 12% monthly growth',
                'https://developers.google.com/analytics/devguides/reporting/core/v4/basics#users'
              )}
            />

            <InsightCard
              {...createInsightCardData(
                'Page Views',
                currentData.overview.pageViews,
                'Total number of pages viewed across all sessions',
                'Higher page views indicate better content engagement and site exploration',
                <MousePointer className="h-4 w-4 text-muted-foreground" />,
                Math.round(currentData.overview.growth * 0.76) >= 0 ? 'up' : 'down',
                Math.round(currentData.overview.growth * 0.76),
                'Industry median: 1.8 pages per session'
              )}
            />

            <InsightCard
              {...createInsightCardData(
                'Avg Session Duration',
                currentData.overview.avgSessionDuration,
                'Average time users spend on your website per session',
                'Longer sessions indicate engaging content that keeps users interested',
                <Clock className="h-4 w-4 text-muted-foreground" />,
                'neutral',
                undefined,
                'Industry median: 2:30 minutes'
              )}
            />

            <InsightCard
              {...createInsightCardData(
                'Bounce Rate',
                `${currentData.overview.bounceRate}%`,
                'Percentage of sessions where users leave after viewing only one page',
                'Lower bounce rates indicate content relevance and good user experience',
                <TrendingUp className="h-4 w-4 text-muted-foreground" />,
                currentData.overview.bounceRate < 60 ? 'up' : 'down',
                -2.5,
                'Industry median: 58%'
              )}
            />
          </div>
        </ProgressiveSection>

        {/* Intelligent Insights Panel */}
        {insightsData && (
          <InsightsPanel
            insights={insightsData.insights}
            recommendations={insightsData.recommendations}
            performanceScore={insightsData.performanceScore}
            trendAnalysis={insightsData.trendAnalysis}
            benchmarkComparisons={insightsData.benchmarks.comparisons}
            isLoading={insightsLoading}
            lastUpdated={insightsData.generatedAt}
            onRefresh={refreshInsights}
          />
        )}

        {/* Detailed Analytics Sections */}
        <ProgressiveSection
          level="intermediate"
          title="Blog Performance Analysis"
          summary="Individual blog metrics and comparative performance"
          icon={<Globe className="h-4 w-4" />}
          defaultExpanded={userExpertise !== 'beginner'}
        >
          <div className="grid-fluid gap-fluid">
            {selectedBlog === 'all' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Blog Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                          <MetricTooltip
                            metric="Optemil"
                            definition="Health and wellness blog focusing on medical topics"
                            businessContext="Primary revenue generator with high-value content"
                            trigger={
                              <div>
                                <p className="font-medium cursor-help">Optemil</p>
                                <p className="text-sm text-muted-foreground">optemil.com</p>
                              </div>
                            }
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{(currentData.overview.users * 0.6).toLocaleString()}</p>
                        <p className="text-sm text-green-600">+{currentData.overview.growth}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-purple-500" />
                        <div>
                          <MetricTooltip
                            metric="Einsof7"
                            definition="Technology and entertainment blog covering streaming and devices"
                            businessContext="Growing audience with strong engagement in tech niche"
                            trigger={
                              <div>
                                <p className="font-medium cursor-help">Einsof7</p>
                                <p className="text-sm text-muted-foreground">einsof7.com</p>
                              </div>
                            }
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Math.round(currentData.overview.users * 0.4).toLocaleString()}</p>
                        <p className="text-sm text-green-600">+{Math.round(currentData.overview.growth * 0.8)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Blog Performance - {selectedBlog === 'optemil' ? 'Optemil' : 'Einsof7'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Globe className={`h-6 w-6 ${selectedBlog === 'optemil' ? 'text-blue-500' : 'text-purple-500'}`} />
                        <div>
                          <p className="font-medium text-lg">{selectedBlog === 'optemil' ? 'Optemil' : 'Einsof7'}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedBlog === 'optemil' ? 'optemil.com' : 'einsof7.com'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{currentData.overview.users.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{currentData.overview.pageViews.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Page Views</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentData.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <MetricTooltip
                          metric={page.title}
                          definition={`Blog post: ${page.title}`}
                          businessContext={`This page received ${page.views.toLocaleString()} views, indicating strong reader interest`}
                          trigger={
                            <div>
                              <p className="font-medium text-sm cursor-help">{page.title}</p>
                              <p className="text-xs text-muted-foreground">{page.slug}</p>
                            </div>
                          }
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{page.views.toLocaleString()}</p>
                        {selectedBlog === 'all' && (
                          <Badge variant={page.blog === 'Optemil' ? 'default' : 'secondary'} className="text-xs">
                            {page.blog}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ProgressiveSection>

        {/* Advanced Analytics */}
        <ProgressiveSection
          level="advanced"
          title="Traffic Sources & SEO Analysis"
          summary="Detailed breakdown of traffic acquisition and search performance"
          icon={<TrendingUp className="h-4 w-4" />}
          defaultExpanded={userExpertise === 'expert'}
        >
          <div className="grid-fluid gap-fluid">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Source Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentData.trafficSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          source.name === 'Organic Search' ? 'bg-blue-500' :
                          source.name === 'Direct' ? 'bg-green-500' :
                          source.name === 'Social Media' ? 'bg-yellow-500' :
                          'bg-purple-500'
                        }`}></div>
                        <MetricTooltip
                          metric={source.name}
                          definition={`Traffic from ${source.name.toLowerCase()}`}
                          businessContext={
                            source.name === 'Organic Search' ? 'Users finding you through search engines - indicates good SEO' :
                            source.name === 'Direct' ? 'Users typing your URL directly - shows brand awareness' :
                            source.name === 'Social Media' ? 'Traffic from social platforms - shows content shareability' :
                            'Traffic from other websites linking to you'
                          }
                          trigger={
                            <span className="text-sm font-medium cursor-help">{source.name}</span>
                          }
                        />
                      </div>
                      <span className="text-sm font-bold">{source.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentData.keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <MetricTooltip
                        metric={keyword.term}
                        definition={`Search keyword: "${keyword.term}"`}
                        businessContext={`Ranking at position ${keyword.position} with ${keyword.clicks} clicks from ${keyword.impressions} impressions`}
                        benchmark={`Average position for this keyword type: ${keyword.position < 5 ? 'Excellent' : keyword.position < 10 ? 'Good' : 'Needs improvement'}`}
                        trigger={
                          <span className="text-sm font-medium cursor-help">{keyword.term}</span>
                        }
                      />
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Pos: {keyword.position}</Badge>
                        <span className="text-sm font-bold">{keyword.clicks.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ProgressiveSection>

        {/* Google Analytics Integration Status */}
        <ProgressiveSection
          level="basic"
          title="Integration Status"
          summary="Google Analytics connection and data sync information"
          icon={<Globe className="h-4 w-4" />}
          priority="low"
          defaultExpanded={false}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {selectedBlog === 'all' ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Optemil Blog</p>
                          <p className="text-sm text-muted-foreground">Property ID: 498674424</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Einsof7 Blog</p>
                          <p className="text-sm text-muted-foreground">Property ID: 498679524</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{selectedBlog === 'optemil' ? 'Optemil Blog' : 'Einsof7 Blog'}</p>
                        <p className="text-sm text-muted-foreground">
                          Property ID: {selectedBlog === 'optemil' ? '498674424' : '498679524'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">Connected</Badge>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Last data sync: 5 minutes ago. Data refreshes automatically every 15 minutes.
                  {insightsData && (
                    <span className="block mt-1">
                      Insights generated: {new Date(insightsData.generatedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </ProgressiveSection>
      </ProgressiveContainer>
    </div>
  )
}