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
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

interface KeywordCategory {
  id: string
  name: string
  description: string
  keyword_variation_id: string
  created_at: string
  keyword_variations?: {
    keyword: string
  }
}

interface KeywordCategoriesTableProps {
  mainKeywordId: string
  initialData: KeywordCategory[]
  totalCount: number
}

export function KeywordCategoriesTable({ mainKeywordId, initialData, totalCount }: KeywordCategoriesTableProps): ReactElement {
  const [categories, setCategories] = useState<KeywordCategory[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(totalCount)
  const perPage = 20

  const fetchCategories = async (pageNum: number = 1) => {
    setLoading(true)
    const supabase = createClient()
    
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    // First get all keyword variations for this main keyword
    const { data: variations } = await supabase
      .from('keyword_variations')
      .select('id')
      .eq('main_keyword_id', mainKeywordId)

    if (!variations || variations.length === 0) {
      setCategories([])
      setTotal(0)
      setLoading(false)
      return
    }

    const variationIds = variations.map(v => v.id)

    const { data, count, error } = await supabase
      .from('keyword_categories')
      .select(`
        *,
        keyword_variations!inner(keyword)
      `, { count: 'exact' })
      .in('keyword_variation_id', variationIds)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      if (pageNum === 1) {
        setCategories(data || [])
      } else {
        setCategories(prev => [...prev, ...(data || [])])
      }
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // Update state when props change
  useEffect(() => {
    setCategories(initialData)
    setTotal(totalCount)
    setPage(1)
  }, [initialData, totalCount, mainKeywordId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCategories(nextPage)
  }

  const hasMore = categories.length < total

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
            <Folder className="h-5 w-5" />
            <span>Keyword Categories ({total})</span>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading && categories.length === 0 ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Related Variation</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs text-sm text-muted-foreground">
                            {category.description ? 
                              (category.description.length > 100 ? 
                                `${category.description.substring(0, 100)}...` : 
                                category.description
                              ) : 
                              '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {category.keyword_variations?.keyword || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(category.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
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
                Showing {categories.length} of {total} categories
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}