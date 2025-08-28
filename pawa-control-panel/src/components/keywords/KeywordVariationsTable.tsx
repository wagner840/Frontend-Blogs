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
import { ChevronDown, ChevronRight, TrendingUp } from 'lucide-react'

interface KeywordVariation {
  id: string
  keyword: string
  variation_type: string
  msv: number
  kw_difficulty: number
  cpc: number
  competition: string
  search_intent: string
  answer: string
}

interface KeywordVariationsTableProps {
  mainKeywordId: string
  initialData: KeywordVariation[]
  totalCount: number
}

export function KeywordVariationsTable({ mainKeywordId, initialData, totalCount }: KeywordVariationsTableProps): ReactElement {
  const [variations, setVariations] = useState<KeywordVariation[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(totalCount)
  const perPage = 20

  const fetchVariations = async (pageNum: number = 1) => {
    setLoading(true)
    const supabase = createClient()
    
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    // Don't request data if we already have all records
    if (pageNum > 1 && variations.length >= total) {
      setLoading(false)
      return
    }

    const { data, count, error } = await supabase
      .from('keyword_variations')
      .select(`
        id, keyword, variation_type, msv, kw_difficulty, cpc, 
        competition, search_intent, answer
      `, { count: 'exact' })
      .eq('main_keyword_id', mainKeywordId)
      .order('msv', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching variations:', error)
      // Reset to previous page on error
      if (pageNum > 1) {
        setPage(prev => prev - 1)
      }
    } else {
      if (pageNum === 1) {
        setVariations(data || [])
      } else {
        setVariations(prev => [...prev, ...(data || [])])
      }
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // Update state when props change
  useEffect(() => {
    setVariations(initialData)
    setTotal(totalCount)
    setPage(1)
    setExpanded(false) // Reset expanded state when keyword changes
  }, [initialData, totalCount, mainKeywordId])

  const loadMore = async () => {
    if (loading) return // Prevent multiple simultaneous requests
    
    const nextPage = page + 1
    console.log('Loading page:', nextPage, 'Total:', total, 'Current count:', variations.length)
    setPage(nextPage)
    await fetchVariations(nextPage)
  }

  const hasMore = variations.length < total && total > 0

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
            <TrendingUp className="h-5 w-5" />
            <span>Keyword Variations ({total})</span>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading && variations.length === 0 ? (
            <div className="text-center py-4">Loading variations...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>MSV</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>CPC</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Intent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variations.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium text-sm truncate">
                              {variation.keyword}
                            </div>
                            {variation.answer && (
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {variation.answer.substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {variation.variation_type || 'Standard'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {variation.msv?.toLocaleString() || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              (variation.kw_difficulty || 0) <= 30 ? 'default' :
                              (variation.kw_difficulty || 0) <= 60 ? 'secondary' : 'destructive'
                            }
                          >
                            {variation.kw_difficulty || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            ${variation.cpc?.toFixed(2) || '0.00'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {variation.competition || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              variation.search_intent === 'commercial' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {variation.search_intent || 'Unknown'}
                          </Badge>
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
                Showing {variations.length} of {total} variations
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}