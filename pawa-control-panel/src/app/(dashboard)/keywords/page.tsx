import { ReactElement } from 'react'
import { KeywordsDataTable } from '@/components/keywords/KeywordsDataTable'
import { createServiceClient } from '@/lib/supabase/server'

interface SearchParams {
  page?: string
  per_page?: string
  sort?: string
  search?: string
  blog_name?: string
  search_intent?: string
  competition?: string
  is_used?: string
}

interface KeywordsPageProps {
  searchParams: SearchParams
}

async function getKeywords(searchParams: SearchParams) {
  const supabase = createServiceClient()
  
  const page = parseInt(searchParams.page || '1')
  const perPage = parseInt(searchParams.per_page || '25') // Reduced page size
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  try {
    const { data, count, error } = await supabase
      .from('main_keywords')
      .select('id, keyword, msv, kw_difficulty, cpc, competition, search_intent, is_used, blog_id', { count: 'exact' })
      .order('msv', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (error) {
      console.error('Keywords fetch error:', error)
      return {
        data: [],
        total: 0,
        page,
        perPage
      }
    }

    // Get blog information  
    const blogIds = Array.from(new Set(data?.map(item => item.blog_id).filter(Boolean) || []))
    let blogs: { id: string; name: string; domain: string }[] = []
    
    if (blogIds.length > 0) {
      const { data: blogData } = await supabase
        .from('blogs')
        .select('id, name, domain')
        .in('id', blogIds)
      blogs = blogData || []
    }

    const enhancedData = data?.map(keyword => ({
      ...keyword,
      blogs: blogs.find(blog => blog.id === keyword.blog_id)
    })) || []

    return {
      data: enhancedData,
      total: count || 0,
      page,
      perPage
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      data: [],
      total: 0,
      page,
      perPage
    }
  }
}

export default async function KeywordsPage({ searchParams }: KeywordsPageProps): Promise<ReactElement> {
  const { data, total, page, perPage } = await getKeywords(searchParams)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Keywords</h1>
        <p className="text-muted-foreground">
          Manage and analyze keyword opportunities across your blog network
        </p>
      </div>

      <KeywordsDataTable
        data={data}
        total={total}
        page={page}
        perPage={perPage}
      />
    </div>
  )
}