'use client'

import { ReactElement, useState } from 'react'
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
  Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BlogData {
  id: string
  name: string
  domain: string
  users: number
  pageViews: number
  avgSession: string
  bounceRate: number
  growth: number
  topPages: Array<{
    title: string
    slug: string
    views: number
    blog?: string
  }>
  trafficSources: Array<{
    name: string
    percentage: number
    color: string
  }>
  keywords: Array<{
    term: string
    position: number
    clicks: number
  }>
}

export default function AnalyticsPage(): ReactElement {
  const [selectedBlog, setSelectedBlog] = useState<string>('all')

  // Mock data for blogs
  const blogsData: Record<string, BlogData> = {
    'optemil': {
      id: 'optemil',
      name: 'Optemil',
      domain: 'optemil.com',
      users: 28543,
      pageViews: 76234,
      avgSession: '4:12',
      bounceRate: 38.5,
      growth: 18.2,
      topPages: [
        { title: 'Ozempic: Como Funciona para Emagrecer', slug: '/ozempic-emagrecer', views: 8543 },
        { title: 'Calistenia para Iniciantes', slug: '/calistenia-iniciantes', views: 4892 },
        { title: 'TDAH: Guia Completo', slug: '/tdah-guia-completo', views: 3421 }
      ],
      trafficSources: [
        { name: 'Organic Search', percentage: 72.3, color: 'bg-blue-500' },
        { name: 'Direct', percentage: 16.8, color: 'bg-green-500' },
        { name: 'Social Media', percentage: 7.2, color: 'bg-yellow-500' },
        { name: 'Referral', percentage: 3.7, color: 'bg-purple-500' }
      ],
      keywords: [
        { term: 'ozempic', position: 3, clicks: 2543 },
        { term: 'calistenia', position: 5, clicks: 1892 },
        { term: 'tdah sintomas', position: 4, clicks: 1634 }
      ]
    },
    'einsof7': {
      id: 'einsof7',
      name: 'Einsof7',
      domain: 'einsof7.com',
      users: 16688,
      pageViews: 52222,
      avgSession: '2:58',
      bounceRate: 45.8,
      growth: 22.8,
      topPages: [
        { title: 'Melhores Filmes Netflix 2024', slug: '/melhores-filmes-netflix', views: 6221 },
        { title: 'Android TV: Guia Completo', slug: '/android-tv-guia', views: 4103 },
        { title: 'Chromecast vs Fire TV Stick', slug: '/chromecast-vs-fire-tv', views: 3856 }
      ],
      trafficSources: [
        { name: 'Organic Search', percentage: 64.1, color: 'bg-blue-500' },
        { name: 'Direct', percentage: 20.2, color: 'bg-green-500' },
        { name: 'Social Media', percentage: 9.4, color: 'bg-yellow-500' },
        { name: 'Referral', percentage: 6.3, color: 'bg-purple-500' }
      ],
      keywords: [
        { term: 'android tv', position: 7, clicks: 1234 },
        { term: 'netflix filmes', position: 2, clicks: 2143 },
        { term: 'chromecast', position: 6, clicks: 987 }
      ]
    }
  }

  // Combined data for "all" blogs
  const combinedData: BlogData = {
    id: 'all',
    name: 'Todos os Blogs',
    domain: 'combined',
    users: 45231,
    pageViews: 128456,
    avgSession: '3:24',
    bounceRate: 42.1,
    growth: 20.1,
    topPages: [
      { title: 'Ozempic: Como Funciona para Emagrecer', slug: '/ozempic-emagrecer', views: 8543, blog: 'Optemil' },
      { title: 'Melhores Filmes Netflix 2024', slug: '/melhores-filmes-netflix', views: 6221, blog: 'Einsof7' },
      { title: 'Calistenia para Iniciantes', slug: '/calistenia-iniciantes', views: 4892, blog: 'Optemil' }
    ],
    trafficSources: [
      { name: 'Organic Search', percentage: 68.2, color: 'bg-blue-500' },
      { name: 'Direct', percentage: 18.5, color: 'bg-green-500' },
      { name: 'Social Media', percentage: 8.3, color: 'bg-yellow-500' },
      { name: 'Referral', percentage: 5.0, color: 'bg-purple-500' }
    ],
    keywords: [
      { term: 'ozempic', position: 3, clicks: 2543 },
      { term: 'netflix filmes', position: 2, clicks: 2143 },
      { term: 'calistenia', position: 5, clicks: 1892 }
    ]
  }

  const currentData = selectedBlog === 'all' ? combinedData : blogsData[selectedBlog] || combinedData

  return (
    <div className="space-y-6">
      {/* Header with Blog Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-fluid-xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track your blog performance and Google Analytics insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBlog} onValueChange={setSelectedBlog}>
            <SelectTrigger className="w-48">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.users.toLocaleString()}</div>
            <p className={`text-xs flex items-center ${currentData.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentData.growth >= 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              {currentData.growth >= 0 ? '+' : ''}{currentData.growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.pageViews.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +{Math.round(currentData.growth * 0.76)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.avgSession}</div>
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
            <div className="text-2xl font-bold">{currentData.bounceRate}%</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" />
              -2.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <p className="font-bold">{blogsData.optemil.users.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{blogsData.optemil.growth}%</p>
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
                    <p className="font-bold">{blogsData.einsof7.users.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{blogsData.einsof7.growth}%</p>
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
                    <p className="text-2xl font-bold">{currentData.users.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{currentData.pageViews.toLocaleString()}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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