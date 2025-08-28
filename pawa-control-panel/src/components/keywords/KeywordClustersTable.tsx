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
import { ChevronDown, ChevronRight, Layers } from 'lucide-react'

interface KeywordCluster {
  id: string
  cluster_name: string
  description: string
  cluster_score: number
  created_at: string
}

interface KeywordClustersTableProps {
  mainKeywordId: string
  initialData: KeywordCluster[]
  totalCount: number
}

export function KeywordClustersTable({ mainKeywordId, initialData, totalCount }: KeywordClustersTableProps): ReactElement {
  const [clusters, setClusters] = useState<KeywordCluster[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(totalCount)
  const perPage = 20

  const fetchClusters = async (pageNum: number = 1) => {
    setLoading(true)
    const supabase = createClient()
    
    const from = (pageNum - 1) * perPage
    const to = from + perPage - 1

    const { data, count, error } = await supabase
      .from('keyword_clusters')
      .select('*', { count: 'exact' })
      .eq('main_keyword_id', mainKeywordId)
      .order('cluster_score', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching clusters:', error)
    } else {
      if (pageNum === 1) {
        setClusters(data || [])
      } else {
        setClusters(prev => [...prev, ...(data || [])])
      }
      setTotal(count || 0)
    }
    setLoading(false)
  }

  // Update state when props change
  useEffect(() => {
    setClusters(initialData)
    setTotal(totalCount)
    setPage(1)
  }, [initialData, totalCount, mainKeywordId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchClusters(nextPage)
  }

  const hasMore = clusters.length < total

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
            <Layers className="h-5 w-5" />
            <span>Keyword Clusters ({total})</span>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent>
          {loading && clusters.length === 0 ? (
            <div className="text-center py-4">Loading clusters...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cluster Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clusters.map((cluster) => (
                      <TableRow key={cluster.id}>
                        <TableCell>
                          <div className="font-medium">
                            {cluster.cluster_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs text-sm text-muted-foreground">
                            {cluster.description ? 
                              (cluster.description.length > 100 ? 
                                `${cluster.description.substring(0, 100)}...` : 
                                cluster.description
                              ) : 
                              '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              (cluster.cluster_score || 0) >= 0.8 ? 'default' :
                              (cluster.cluster_score || 0) >= 0.6 ? 'secondary' : 'outline'
                            }
                          >
                            {cluster.cluster_score ? 
                              (cluster.cluster_score * 100).toFixed(1) + '%' : 
                              '-'
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(cluster.created_at).toLocaleDateString('pt-BR', {
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
                Showing {clusters.length} of {total} clusters
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}