import { ReactElement } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  MousePointer,
  Clock,
  TrendingUp,
  Globe,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsPage(): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Track your blog performance and Google Analytics insights across all your blogs
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128,456</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              +15.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3:24</div>
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
            <div className="text-2xl font-bold">42.1%</div>
            <p className="text-xs text-green-600 flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" />
              -2.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <p className="font-bold">28,543</p>
                  <p className="text-sm text-green-600">+18.2%</p>
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
                  <p className="font-bold">16,688</p>
                  <p className="text-sm text-green-600">+22.8%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">Ozempic: Como Funciona</p>
                  <p className="text-xs text-muted-foreground">/ozempic-como-funciona</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">8,543</p>
                  <Badge variant="default" className="text-xs">Optemil</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">Melhores Filmes Netflix</p>
                  <p className="text-xs text-muted-foreground">/melhores-filmes-netflix</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">6,221</p>
                  <Badge variant="secondary" className="text-xs">Einsof7</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">Calistenia para Iniciantes</p>
                  <p className="text-xs text-muted-foreground">/calistenia-iniciantes</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">4,892</p>
                  <Badge variant="default" className="text-xs">Optemil</Badge>
                </div>
              </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Organic Search</span>
                </div>
                <span className="text-sm font-bold">68.2%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Direct</span>
                </div>
                <span className="text-sm font-bold">18.5%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Social Media</span>
                </div>
                <span className="text-sm font-bold">8.3%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Referral</span>
                </div>
                <span className="text-sm font-bold">5.0%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Search Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">ozempic</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">Pos: 3</Badge>
                  <span className="text-sm font-bold">2,543</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">calistenia</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">Pos: 5</Badge>
                  <span className="text-sm font-bold">1,892</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">android tv</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">Pos: 7</Badge>
                  <span className="text-sm font-bold">1,234</span>
                </div>
              </div>
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
            
            <p className="text-xs text-muted-foreground">
              Last data sync: 5 minutes ago. Data refreshes automatically every 15 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}