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
import { ChevronDown, ChevronRight, Lightbulb, Calendar } from 'lucide-react'

interface ContentOpportunity {
  id: string
  title: string
  description: string
  content_type: string
  priority_score: number
  estimated_traffic: number
  difficulty_score: number
  status: string
  target_keywords: string[]
  content_outline: string
  notes: string
  due_date: string
  final_title: string
  final_description: string
  created_at: string
  source_type: 'cluster' | 'category'
  source_id: string
}

interface ContentOpportunitiesTableProps {
  mainKeywordId: string
  initialData: ContentOpportunity[]
  totalCount: number
}

export function ContentOpportunitiesTable({ mainKeywordId, initialData, totalCount }: ContentOpportunitiesTableProps): ReactElement {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(totalCount)
  const perPage = 20

  const fetchOpportunities = async (pageNum: number = 1) => {
    setLoading(true)
    const supabase = createClient()
    
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    const { data, count, error } = await supabase
      .from('content_opportunities_unified')
      .select('*', { count: 'exact' })
      .eq('main_keyword_id', mainKeywordId)
      .order('priority_score', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching opportunities:', error)
    } else {
      if (pageNum === 1) {
        setOpportunities(data || [])
      } else {
        setOpportunities(prev => [...prev, ...(data || [])])
      }
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // Update state when props change
  useEffect(() => {
    setOpportunities(initialData)
    setTotal(totalCount)
    setPage(1)
  }, [initialData, totalCount, mainKeywordId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchOpportunities(nextPage)
  }

  const hasMore = opportunities.length < total

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'default'
      case 'in-progress': return 'secondary'
      case 'draft': return 'outline'
      case 'idea': return 'destructive'
      default: return 'outline'
    }
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
            <Lightbulb className="h-5 w-5" />
            <span>Content Opportunities ({total})</span>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading && opportunities.length === 0 ? (
            <div className="text-center py-4">Loading content opportunities...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title & Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Traffic Est.</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Target Keywords</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunities.map((opportunity) => (
                      <TableRow key={opportunity.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium text-sm">
                              {opportunity.final_title || opportunity.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {opportunity.final_description || opportunity.description ? 
                                ((opportunity.final_description || opportunity.description).length > 80 ? 
                                  `${(opportunity.final_description || opportunity.description).substring(0, 80)}...` : 
                                  (opportunity.final_description || opportunity.description)
                                ) : 
                                '-'
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.content_type || 'Article'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={opportunity.source_type === 'cluster' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {opportunity.source_type === 'cluster' ? 'Cluster' : 'Category'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              (opportunity.priority_score || 0) >= 80 ? 'default' :
                              (opportunity.priority_score || 0) >= 60 ? 'secondary' : 'outline'
                            }
                          >
                            {opportunity.priority_score?.toFixed(1) || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {opportunity.estimated_traffic?.toLocaleString() || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              (opportunity.difficulty_score || 0) <= 30 ? 'default' :
                              (opportunity.difficulty_score || 0) <= 60 ? 'secondary' : 'destructive'
                            }
                          >
                            {opportunity.difficulty_score?.toFixed(1) || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(opportunity.status)} className="text-xs">
                            {opportunity.status || 'Idea'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {opportunity.target_keywords && opportunity.target_keywords.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {opportunity.target_keywords.slice(0, 2).map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                                {opportunity.target_keywords.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{opportunity.target_keywords.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {opportunity.due_date ? (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(opportunity.due_date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
                Showing {opportunities.length} of {total} content opportunities
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}