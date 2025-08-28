import { ReactElement } from 'react'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  TrendingUp, 
  Target,
  FileText,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { KeywordVariationsTable } from '@/components/keywords/KeywordVariationsTable'
import { KeywordCategoriesTable } from '@/components/keywords/KeywordCategoriesTable'
import { KeywordClustersTable } from '@/components/keywords/KeywordClustersTable'
import { ContentOpportunitiesTable } from '@/components/keywords/ContentOpportunitiesTable'
import { ContentPostsTable } from '@/components/keywords/ContentPostsTable'
import { ContentPost } from '@/types'

interface KeywordDetailPageProps {
  params: { id: string }
}

async function getKeywordDetail(id: string) {
  const supabase = createServiceClient()

  // Get main keyword details
  const { data: mainKeyword, error: mainError } = await supabase
    .from('main_keywords')
    .select(`
      *,
      blogs!inner(id, name, domain)
    `)
    .eq('id', id)
    .single()

  if (mainError || !mainKeyword) {
    return null
  }

  // Get keyword variations first (needed for categories)
  const { data: variations } = await supabase
    .from('keyword_variations')
    .select('id')
    .eq('main_keyword_id', id)

  const variationIds = variations?.map(v => v.id) || []

  // Get counts for each related table with correct category count logic
  const [variationsCount, categoriesCount, clustersCount, opportunitiesCount, postsCount] = await Promise.all([
    supabase.from('keyword_variations').select('id', { count: 'exact', head: true }).eq('main_keyword_id', id),
    // Categories are linked via keyword_variations, not directly to main_keyword
    variationIds.length > 0 
      ? supabase.from('keyword_categories').select('id', { count: 'exact', head: true }).in('keyword_variation_id', variationIds)
      : { count: 0 },
    supabase.from('keyword_clusters').select('id', { count: 'exact', head: true }).eq('main_keyword_id', id),
    supabase.from('content_opportunities_unified').select('id', { count: 'exact', head: true }).eq('main_keyword_id', id),
    // Use view to find posts linked to this main keyword
    supabase.from('content_posts_with_keywords').select('id', { count: 'exact', head: true }).eq('main_keyword_id', id)
  ])

  // Get actual data for the tables (first page)
  const [variationsData, categoriesData, clustersData, opportunitiesData, postsData] = await Promise.all([
    // Variations
    supabase
      .from('keyword_variations')
      .select('*')
      .eq('main_keyword_id', id)
      .order('msv', { ascending: false })
      .range(0, 19),
    
    // Categories (via keyword_variations)
    variationIds.length > 0 
      ? supabase
          .from('keyword_categories')
          .select(`
            *,
            keyword_variations!inner(keyword)
          `)
          .in('keyword_variation_id', variationIds)
          .order('created_at', { ascending: false })
          .range(0, 19)
      : { data: [] },
    
    // Clusters
    supabase
      .from('keyword_clusters')
      .select('*')
      .eq('main_keyword_id', id)
      .order('cluster_score', { ascending: false })
      .range(0, 19),
    
    // Content Opportunities
    supabase
      .from('content_opportunities_unified')
      .select('*')
      .eq('main_keyword_id', id)
      .order('priority_score', { ascending: false })
      .range(0, 19),
    
    // Content Posts - use view to get posts linked to this main keyword
    supabase
      .from('content_posts_with_keywords')
      .select(`
        id, title, slug, excerpt, content, status, featured_image_url, 
        seo_title, seo_description, focus_keyword, readability_score, seo_score, 
        word_count, reading_time, scheduled_at, published_at, 
        wordpress_post_id, created_at, updated_at, blog_id, author_id,
        blogs!inner(name, domain),
        authors!inner(name, email)
      `)
      .eq('main_keyword_id', id)
      .order('created_at', { ascending: false })
      .range(0, 19)
  ])

  return {
    mainKeyword,
    counts: {
      variations: variationsCount.count || 0,
      categories: categoriesCount.count || 0,
      clusters: clustersCount.count || 0,
      opportunities: opportunitiesCount.count || 0,
      posts: postsCount.count || 0
    },
    data: {
      variations: variationsData.data || [],
      categories: categoriesData.data || [],
      clusters: clustersData.data || [],
      opportunities: opportunitiesData.data || [],
      posts: (postsData.data || []) as unknown as ContentPost[]
    }
  }
}

export default async function KeywordDetailPage({ params }: KeywordDetailPageProps): Promise<ReactElement> {
  const result = await getKeywordDetail(params.id)

  if (!result) {
    notFound()
  }

  const { mainKeyword, counts, data } = result

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/keywords">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Keywords
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{mainKeyword.keyword}</h1>
            <p className="text-muted-foreground">
              Keyword analysis and content hierarchy for {mainKeyword.blogs?.name}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {mainKeyword.blogs?.name}
        </Badge>
      </div>

      {/* Main Keyword Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Search Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mainKeyword.msv?.toLocaleString() || '-'}</div>
            <p className="text-xs text-muted-foreground">
              Difficulty: {mainKeyword.kw_difficulty || '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPC & Competition</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mainKeyword.cpc || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              {mainKeyword.competition || 'Unknown'} competition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Intent</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={mainKeyword.search_intent === 'commercial' ? 'default' : 'secondary'}>
                {mainKeyword.search_intent || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {mainKeyword.is_used ? 'Used' : 'Available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Pipeline</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.posts}</div>
            <p className="text-xs text-muted-foreground">
              Published posts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Hierarchy Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Content Hierarchy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{counts.variations}</div>
              <div className="text-sm text-muted-foreground">Keyword Variations</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{counts.categories}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{counts.clusters}</div>
              <div className="text-sm text-muted-foreground">Clusters</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{counts.opportunities}</div>
              <div className="text-sm text-muted-foreground">Content Opportunities</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{counts.posts}</div>
              <div className="text-sm text-muted-foreground">WordPress Posts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <div className="space-y-8">
        {/* Keyword Variations */}
        {counts.variations > 0 && (
          <KeywordVariationsTable 
            mainKeywordId={params.id} 
            initialData={data.variations}
            totalCount={counts.variations}
          />
        )}

        {/* Categories */}
        {counts.categories > 0 && (
          <KeywordCategoriesTable 
            mainKeywordId={params.id}
            initialData={data.categories}
            totalCount={counts.categories}
          />
        )}

        {/* Clusters */}
        {counts.clusters > 0 && (
          <KeywordClustersTable 
            mainKeywordId={params.id}
            initialData={data.clusters}
            totalCount={counts.clusters}
          />
        )}

        {/* Content Opportunities */}
        {counts.opportunities > 0 && (
          <ContentOpportunitiesTable 
            mainKeywordId={params.id}
            initialData={data.opportunities}
            totalCount={counts.opportunities}
          />
        )}

        {/* Content Posts */}
        {counts.posts > 0 && (
          <ContentPostsTable 
            mainKeywordId={params.id}
            initialData={data.posts}
            totalCount={counts.posts}
          />
        )}
      </div>
    </div>
  )
}