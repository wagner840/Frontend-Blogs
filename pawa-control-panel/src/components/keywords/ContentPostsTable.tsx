'use client'

import { ReactElement, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronRight, FileText, ExternalLink, Eye } from 'lucide-react'
import { ContentPost } from '@/types'

interface ContentPostsTableProps {
  mainKeywordId: string
  initialData: ContentPost[]
  totalCount: number
}

export function ContentPostsTable({ mainKeywordId, initialData, totalCount }: ContentPostsTableProps): ReactElement {
  const [posts, setPosts] = useState<ContentPost[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(totalCount)
  const perPage = 20

  const fetchPosts = async (pageNum: number = 1) => {
    setLoading(true)
    const supabase = createClient()
    
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    const { data, count, error } = await supabase
      .from('content_posts_with_keywords')
      .select(`
        id, title, slug, excerpt, status, seo_title, seo_description, focus_keyword,
        readability_score, seo_score, word_count, reading_time, published_at, 
        wordpress_post_id, created_at, blog_id, author_id,
        blogs!inner(name, domain),
        authors!inner(name, email)
      `, { count: 'exact' })
      .eq('main_keyword_id', mainKeywordId)
      .order('published_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching posts:', error)
    } else {
      if (pageNum === 1) {
        setPosts((data || []) as unknown as ContentPost[])
      } else {
        setPosts(prev => [...prev, ...((data || []) as unknown as ContentPost[])])
      }
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // Update state when props change
  useEffect(() => {
    setPosts(initialData)
    setTotal(totalCount)
    setPage(1)
  }, [initialData, totalCount, mainKeywordId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  const hasMore = posts.length < total

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'publish': return 'default'
      case 'draft': return 'secondary'
      case 'private': return 'outline'
      case 'trash': return 'destructive'
      default: return 'outline'
    }
  }

  const getScoreVariant = (score: number | null) => {
    if (!score) return 'outline'
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <FileText className="h-5 w-5" />
            <span>WordPress Posts ({total})</span>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading && posts.length === 0 ? (
            <div className="text-center py-4">Loading WordPress posts...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title & Blog</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SEO Score</TableHead>
                      <TableHead>Readability</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>WP ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium text-sm line-clamp-2">
                              {post.title}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {post.blogs?.name || 'Unknown'}
                              </Badge>
                              {post.slug && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <span className="truncate max-w-24">{post.slug}</span>
                                  <a
                                    href={`https://${post.blogs?.domain}/${post.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {post.authors?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(post.status || 'draft')} className="text-xs">
                            {post.status || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.seo_score ? (
                            <Badge variant={getScoreVariant(post.seo_score)}>
                              {post.seo_score}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.readability_score ? (
                            <Badge variant={getScoreVariant(post.readability_score)}>
                              {post.readability_score}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {post.word_count?.toLocaleString() || '-'}
                          </div>
                          {post.reading_time && (
                            <div className="text-xs text-muted-foreground">
                              {post.reading_time} min read
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.published_at ? (
                            <div className="text-sm">
                              {new Date(post.published_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not published</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.wordpress_post_id ? (
                            <a
                              href={`https://${post.blogs?.domain}/?p=${post.wordpress_post_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              <Badge variant="outline" className="text-xs font-mono cursor-pointer hover:bg-gray-100">
                                #{post.wordpress_post_id}
                              </Badge>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {/* Link via Slug */}
                            {post.slug && post.blogs?.domain && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`https://${post.blogs?.domain}/${post.slug}`, '_blank')}
                                title="Ver post via URL"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            {/* Link via WordPress Post ID */}
                            {post.wordpress_post_id && post.blogs?.domain && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`https://${post.blogs?.domain}/?p=${post.wordpress_post_id}`, '_blank')}
                                title="Ver post via WordPress ID"
                                className="text-xs"
                              >
                                WP
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button 
                    onClick={loadMore} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}

              <div className="text-sm text-muted-foreground text-center mt-2">
                Showing {posts.length} of {total} WordPress posts
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}