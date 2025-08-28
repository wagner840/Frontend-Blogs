import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface PostWithBlog {
  id: string
  title: string
  slug: string | null
  status: string
  published_at: string | null
  created_at: string | null
  updated_at: string | null
  wordpress_post_id: number | null
  blogs: {
    name: string
    domain: string
  }[] | null
}

export async function GET() {
  const supabase = createServiceClient()

  // Get all posts and check their status (removed limit to see all posts)
  const { data: posts, error } = await supabase
    .from('content_posts')
    .select(`
      id, 
      title, 
      slug, 
      status, 
      published_at,
      created_at,
      updated_at,
      wordpress_post_id,
      blogs(name, domain)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group by status
  const statusCounts = posts.reduce((acc: Record<string, number>, post) => {
    acc[post.status] = (acc[post.status] || 0) + 1
    return acc
  }, {})

  // Find posts without wordpress_post_id but marked as published
  const postsWithoutWordPressId = posts.filter(post => 
    !post.wordpress_post_id && post.status === 'published'
  )

  // Find posts with wordpress_post_id 
  const postsWithWordPressId = posts.filter(post => 
    post.wordpress_post_id && post.status === 'published'
  )

  // Group posts by blog and status
  const blogStats = posts.reduce((acc: Record<string, {
    total: number;
    published: number;
    draft: number;
    with_wordpress_id: number;
    without_wordpress_id: number;
  }>, post) => {
    const blogName = (post as PostWithBlog).blogs?.[0]?.name || 'Unknown'
    if (!acc[blogName]) {
      acc[blogName] = {
        total: 0,
        published: 0,
        draft: 0,
        with_wordpress_id: 0,
        without_wordpress_id: 0
      }
    }
    
    acc[blogName].total++
    if (post.status === 'published') acc[blogName].published++
    if (post.status === 'draft') acc[blogName].draft++
    if (post.wordpress_post_id) acc[blogName].with_wordpress_id++
    if (!post.wordpress_post_id) acc[blogName].without_wordpress_id++
    
    return acc
  }, {})

  return NextResponse.json({
    totalPosts: posts.length,
    statusCounts,
    postsWithoutWordPressId: postsWithoutWordPressId.length,
    postsWithWordPressId: postsWithWordPressId.length,
    blogStats,
    postsWithoutWordPressIdExamples: postsWithoutWordPressId.slice(0, 3).map(post => ({
      id: post.id,
      title: post.title,
      status: post.status,
      published_at: post.published_at,
      wordpress_post_id: post.wordpress_post_id,
      blog: (post as PostWithBlog).blogs?.[0]?.name,
      has_slug: !!post.slug
    })),
    postsWithWordPressIdExamples: postsWithWordPressId.slice(0, 3).map(post => ({
      id: post.id,
      title: post.title,
      status: post.status,
      published_at: post.published_at,
      wordpress_post_id: post.wordpress_post_id,
      blog: (post as PostWithBlog).blogs?.[0]?.name,
      has_slug: !!post.slug
    }))
  })
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  
  try {
    const { action } = await request.json()

    if (action === 'fix_status') {
      // Strategy: Update posts created more than 1 hour ago to 'publish' 
      // and set published_at to created_at (assuming they were published after creation)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      
      // First get the posts to update
      const { data: postsToUpdate } = await supabase
        .from('content_posts')
        .select('id, created_at')
        .eq('status', 'draft')
        .lt('created_at', oneHourAgo)

      if (!postsToUpdate || postsToUpdate.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No posts found to update',
          updatedPosts: []
        })
      }

      // Update posts using a bulk update approach
      const postIds = postsToUpdate.map(post => post.id)
      
      // Do the bulk update - for simplicity, set published_at to a recent date
      // In a real scenario, you'd want to fetch the actual published date from WordPress
      const { data: updatedPosts, error } = await supabase
        .from('content_posts')
        .update({ 
          status: 'published',  // Try 'published' instead of 'publish'
          published_at: new Date().toISOString()
        })
        .in('id', postIds)
        .select('id, title, status, created_at, published_at')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedPosts?.length || 0} posts to 'publish' status`,
        updatedPosts: updatedPosts?.slice(0, 10) // Return first 10 as examples
      })
    }

    if (action === 'fix_posts_without_wordpress_id') {
      // Find posts that are marked as published but don't have wordpress_post_id
      // These should be set back to draft status
      const { data: postsToUpdate } = await supabase
        .from('content_posts')
        .select('id, title, wordpress_post_id, slug')
        .eq('status', 'published')
        .is('wordpress_post_id', null)

      if (!postsToUpdate || postsToUpdate.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No posts without WordPress ID found',
          updatedPosts: []
        })
      }

      // Update these posts to draft status and remove published_at
      const postIds = postsToUpdate.map(post => post.id)
      
      const { data: updatedPosts, error } = await supabase
        .from('content_posts')
        .update({ 
          status: 'draft',
          published_at: null
        })
        .in('id', postIds)
        .select('id, title, status, wordpress_post_id, published_at')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedPosts?.length || 0} posts without WordPress ID back to draft status`,
        updatedPosts: updatedPosts?.slice(0, 10) // Return first 10 as examples
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}