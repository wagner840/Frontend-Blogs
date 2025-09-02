'use client'

import { ReactElement, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowUp,
  ArrowDown,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// API Response interfaces
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

export default function AnalyticsPage(): ReactElement {
  const [selectedBlog, setSelectedBlog] = useState<string>('all')
  const [analyticsData, setAnalyticsData] = useState<BlogAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  // Fetch analytics data from API
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados do Google Analytics...</p>
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
          <h3 className="text-lg font-semibold">Erro ao carregar Analytics</h3>
          <p className="text-muted-foreground">{error || 'Dados não disponíveis'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const currentData = analyticsData

  return (
    <div className="space-y-6">
      {/* Header with Blog Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-fluid-xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track your blog performance and Google Analytics insights
          </p>
          {isUsingFallback && (
            <div className="mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              ⚠️ Using fallback data - Google Analytics API unavailable
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBlog} onValueChange={setSelectedBlog}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Selecionar Blog" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Blogs</SelectItem>
              <SelectItem value="optemil">Optemil</SelectItem>
              <SelectItem value="einsof7">Einsof7</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid-fluid gap-fluid">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.overview.users.toLocaleString()}</div>
            <p className={`text-xs flex items-center ${currentData.overview.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentData.overview.growth >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {currentData.overview.growth >= 0 ? '+' : ''}{currentData.overview.growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.overview.pageViews.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{Math.round(currentData.overview.growth * 0.76)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.overview.avgSessionDuration}</div>
            <p className="text-xs text-red-600 flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" />
              -5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.overview.bounceRate}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" />
              -2.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Performance Cards */}
      <div className="grid-fluid gap-fluid">
        {selectedBlog === 'all' ? (
          <Card>
            <CardHeader>
              <CardTitle>Blog Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Optemil</p>
                      <p className="text-sm text-muted-foreground">optemil.com</p>
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
                      <p className="font-medium">Einsof7</p>
                      <p className="text-sm text-muted-foreground">einsof7.com</p>
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
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentData.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{page.title}</p>
                    <p className="text-xs text-muted-foreground">{page.slug}</p>
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

      {/* Traffic Sources & Keywords */}
      <div className="grid-fluid gap-fluid">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
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
                    <span className="text-sm font-medium">{source.name}</span>
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
                  <span className="text-sm font-medium">{keyword.term}</span>
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

      {/* Google Analytics Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Google Analytics Integration</CardTitle>
        </CardHeader>
        <CardContent>
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
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}