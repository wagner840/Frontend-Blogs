import { ReactElement } from 'react'
import { ContentDataTable } from '@/components/content/ContentDataTable'
import { createServiceClient } from '@/lib/supabase/server'
import type { ContentPost } from '@/types'

interface SearchParams {
  page?: string
  per_page?: string
  sort?: string
  search?: string
  blog_id?: string
  status?: string
  author_id?: string
}

interface ContentPageProps {
  searchParams: SearchParams
}

async function getContentPosts(searchParams: SearchParams) {
  const supabase = createServiceClient()
  
  const page = parseInt(searchParams.page || '1')
  const perPage = parseInt(searchParams.per_page || '50')
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('content_posts')
    .select(`
      *,
      blogs(id, name, domain),
      authors(name, email)
    `, { count: 'exact' })

  // Global search
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,content.ilike.%${searchParams.search}%`)
  }

  // Column filters
  if (searchParams.blog_id) {
    query = query.eq('blog_id', searchParams.blog_id)
  }
  
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  
  if (searchParams.author_id) {
    query = query.eq('author_id', searchParams.author_id)
  }

  // Sorting
  if (searchParams.sort) {
    const [column, direction] = searchParams.sort.split('.')
    query = query.order(column, { ascending: direction === 'asc' })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  // Pagination
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    throw new Error(`Failed to fetch content posts: ${error.message}`)
  }

  return {
    data: data as ContentPost[],
    total: count || 0,
    page,
    perPage
  }
}

async function getBlogs() {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('blogs')
    .select('id, name, domain')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching blogs:', error)
    return []
  }

  return data || []
}

export default async function ContentPage({ searchParams }: ContentPageProps): Promise<ReactElement> {
  const [{ data, total, page, perPage }, blogs] = await Promise.all([
    getContentPosts(searchParams),
    getBlogs()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
        <p className="text-muted-foreground">
          Manage and monitor content posts synchronized from WordPress blogs
        </p>
      </div>

      <ContentDataTable
        data={data}
        total={total}
        page={page}
        perPage={perPage}
        blogs={blogs}
      />
    </div>
  )
}