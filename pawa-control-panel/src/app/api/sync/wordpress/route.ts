import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverEnv as env } from '@/lib/env'
import { z } from 'zod'

// WordPress webhook payload schema
const wordpressWebhookSchema = z.object({
  ID: z.number(),
  post_title: z.string(),
  post_name: z.string(), // slug
  post_content: z.string(),
  post_excerpt: z.string().optional(),
  post_status: z.enum(['publish', 'draft', 'private', 'trash']),
  post_type: z.literal('post'),
  post_author: z.string(),
  post_date: z.string(),
  post_modified: z.string(),
  featured_media_url: z.string().url().optional(),
  meta: z.object({
    _yoast_wpseo_title: z.string().optional(),
    _yoast_wpseo_metadesc: z.string().optional(),
    _yoast_wpseo_focuskw: z.string().optional(),
    _yoast_wpseo_content_score: z.number().optional(),
    _yoast_wpseo_readability_score: z.number().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  blog_url: z.string().url(),
})

type WordPressWebhook = z.infer<typeof wordpressWebhookSchema>

// Basic Auth validation
function validateBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  try {
    const base64Credentials = authHeader.substring(6)
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    const [username, password] = credentials.split(':')

    // Check against configured WordPress credentials for each blog
    const validCredentials = [
      { user: env.WORDPRESS_BLOG1_USERNAME, pass: env.WORDPRESS_BLOG1_PASSWORD },
      { user: env.WORDPRESS_BLOG2_USERNAME, pass: env.WORDPRESS_BLOG2_PASSWORD },
      // Only include blog3 credentials if configured
      ...(env.WORDPRESS_BLOG3_USERNAME && env.WORDPRESS_BLOG3_PASSWORD 
        ? [{ user: env.WORDPRESS_BLOG3_USERNAME, pass: env.WORDPRESS_BLOG3_PASSWORD }] 
        : []
      ),
    ]

    return validCredentials.some(cred => cred.user === username && cred.pass === password)
  } catch {
    return false
  }
}

// Get blog_id from URL
function getBlogIdFromUrl(blogUrl: string): string {
  const blogMappings: Record<string, string> = {
    [env.WORDPRESS_BLOG1_URL as string]: 'blog1',
    [env.WORDPRESS_BLOG2_URL as string]: 'blog2',
    // Only include blog3 if it's configured
    ...(env.WORDPRESS_BLOG3_URL ? { 
      [env.WORDPRESS_BLOG3_URL as string]: 'blog3'
    } : {}),
  }
  
  return blogMappings[blogUrl] || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // Validate Basic Auth
    if (!validateBasicAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid credentials' },
        { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="WordPress Sync"' } }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    let webhookData: WordPressWebhook
    try {
      webhookData = wordpressWebhookSchema.parse(body)
    } catch (error) {
      console.error('WordPress webhook validation error:', error)
      return NextResponse.json(
        { error: 'Invalid payload', details: error },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL as string,
      env.SUPABASE_SERVICE_ROLE_KEY as string
    )

    // Get blog ID from blog URL
    const blogIdentifier = getBlogIdFromUrl(webhookData.blog_url)
    
    // Check if blog exists, if not create it
    const { data: blogData, error: blogError } = await supabase
      .from('blogs')
      .select('id')
      .eq('name', blogIdentifier)
      .single()

    let blogId: string

    if (blogError && blogError.code === 'PGRST116') {
      // Blog doesn't exist, create it
      const { data: newBlog, error: createBlogError } = await supabase
        .from('blogs')
        .insert({
          name: blogIdentifier,
          url: webhookData.blog_url,
          status: 'active'
        })
        .select('id')
        .single()

      if (createBlogError) {
        console.error('Error creating blog:', createBlogError)
        return NextResponse.json(
          { error: 'Failed to create blog entry' },
          { status: 500 }
        )
      }

      blogId = newBlog.id
    } else if (blogError) {
      console.error('Error fetching blog:', blogError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    } else {
      blogId = blogData.id
    }

    // Get or create author
    const { data: authorData, error: authorError } = await supabase
      .from('users')
      .select('id')
      .eq('email', `${webhookData.post_author}@${blogIdentifier}.com`)
      .single()

    let authorId: string

    if (authorError && authorError.code === 'PGRST116') {
      // Author doesn't exist, create it
      const { data: newAuthor, error: createAuthorError } = await supabase
        .from('users')
        .insert({
          email: `${webhookData.post_author}@${blogIdentifier}.com`,
          name: webhookData.post_author,
          role: 'author'
        })
        .select('id')
        .single()

      if (createAuthorError) {
        console.error('Error creating author:', createAuthorError)
        return NextResponse.json(
          { error: 'Failed to create author entry' },
          { status: 500 }
        )
      }

      authorId = newAuthor.id
    } else if (authorError) {
      console.error('Error fetching author:', authorError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    } else {
      authorId = authorData.id
    }

    // Calculate word count and reading time
    const wordCount = webhookData.post_content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200) // ~200 words per minute

    // Prepare content post data
    const contentPostData = {
      blog_id: blogId,
      author_id: authorId,
      title: webhookData.post_title,
      slug: webhookData.post_name,
      excerpt: webhookData.post_excerpt || '',
      content: webhookData.post_content,
      status: webhookData.post_status,
      featured_image_url: webhookData.featured_media_url || null,
      seo_title: webhookData.meta?._yoast_wpseo_title || null,
      seo_description: webhookData.meta?._yoast_wpseo_metadesc || null,
      focus_keyword: webhookData.meta?._yoast_wpseo_focuskw || null,
      readability_score: webhookData.meta?._yoast_wpseo_readability_score || null,
      seo_score: webhookData.meta?._yoast_wpseo_content_score || null,
      word_count: wordCount,
      reading_time: readingTime,
      published_at: webhookData.post_status === 'publish' 
        ? new Date(webhookData.post_date).toISOString()
        : null,
      wordpress_post_id: webhookData.ID,
      updated_at: new Date().toISOString(),
    }

    // Upsert content post (update if exists, insert if not)
    const { data: upsertData, error: upsertError } = await supabase
      .from('content_posts')
      .upsert(contentPostData, {
        onConflict: 'blog_id,wordpress_post_id',
        ignoreDuplicates: false
      })
      .select('id, title, slug')

    if (upsertError) {
      console.error('Error upserting content post:', upsertError)
      return NextResponse.json(
        { error: 'Failed to sync content post', details: upsertError.message },
        { status: 500 }
      )
    }

    console.log('Content post synced successfully:', {
      post_id: webhookData.ID,
      title: webhookData.post_title,
      blog: blogIdentifier,
      action: upsertData && upsertData.length > 0 ? 'upserted' : 'no_change'
    })

    return NextResponse.json({
      success: true,
      message: 'Content post synced successfully',
      data: {
        post_id: webhookData.ID,
        title: webhookData.post_title,
        slug: webhookData.post_name,
        blog: blogIdentifier,
        sync_time: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('WordPress sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WordPress Content Synchronization API',
    endpoints: {
      POST: '/api/sync/wordpress - Receive WordPress webhook data'
    },
    authentication: 'Basic Auth required',
    supported_events: ['post_updated', 'post_published', 'post_deleted']
  })
}