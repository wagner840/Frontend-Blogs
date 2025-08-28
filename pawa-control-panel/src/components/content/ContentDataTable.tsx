'use client'

import { ReactElement, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye
} from 'lucide-react'
import type { ContentPost } from '@/types'

interface ContentDataTableProps {
  data: ContentPost[]
  total: number
  page: number
  perPage: number
}

export function ContentDataTable({ 
  data, 
  total, 
  page, 
  perPage 
}: ContentDataTableProps): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [globalFilter, setGlobalFilter] = useState(searchParams.get('search') || '')

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Reset to first page when filtering/searching
    if ('search' in updates || Object.keys(updates).some(key => key.endsWith('_filter'))) {
      params.delete('page')
    }
    
    router.push(`/content?${params.toString()}`)
  }, [router, searchParams])

  const columns: ColumnDef<ContentPost>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'title.asc' : 'title.desc' })}
          className="h-8 px-2"
        >
          Title
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const title = row.getValue('title') as string
        const slug = row.original.slug as string
        const blog = row.original.blogs as { name: string; domain: string } | undefined
        
        return (
          <div className="space-y-1">
            <div className="font-medium text-sm line-clamp-2 max-w-xs">
              {title}
            </div>
            {slug && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span className="truncate max-w-48">{slug}</span>
                <a
                  href={`https://${blog?.domain}/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'blogs.name',
      header: 'Blog',
      cell: ({ row }) => {
        const blog = row.original.blogs as { name: string; domain: string } | undefined
        return (
          <Badge variant="outline">
            {blog?.name || 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'authors.name',
      header: 'Author',
      cell: ({ row }) => {
        const author = row.original.authors as { name: string; email: string } | undefined
        return (
          <div className="text-sm">
            {author?.name || 'Unknown'}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variant = status === 'publish' ? 'default' : 
                      status === 'draft' ? 'secondary' : 
                      status === 'private' ? 'outline' : 'destructive'
        return (
          <Badge variant={variant}>
            {status || 'unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'published_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'published_at.asc' : 'published_at.desc' })}
          className="h-8 px-2"
        >
          Published
          {column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const publishedAt = row.getValue('published_at') as string | null
        if (!publishedAt) return <span className="text-muted-foreground">-</span>
        
        return (
          <div className="text-sm">
            {new Date(publishedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'word_count',
      header: 'Words',
      cell: ({ row }) => {
        const wordCount = row.getValue('word_count') as number | null
        return (
          <div className="text-right text-sm">
            {wordCount?.toLocaleString() || '-'}
          </div>
        )
      },
    },
    {
      accessorKey: 'seo_score',
      header: 'SEO Score',
      cell: ({ row }) => {
        const seoScore = row.getValue('seo_score') as number | null
        if (!seoScore) return <span className="text-muted-foreground">-</span>
        
        const variant = seoScore >= 80 ? 'default' : 
                      seoScore >= 60 ? 'secondary' : 'destructive'
        return (
          <Badge variant={variant}>
            {seoScore}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'readability_score',
      header: 'Readability',
      cell: ({ row }) => {
        const readabilityScore = row.getValue('readability_score') as number | null
        if (!readabilityScore) return <span className="text-muted-foreground">-</span>
        
        const variant = readabilityScore >= 80 ? 'default' : 
                      readabilityScore >= 60 ? 'secondary' : 'destructive'
        return (
          <Badge variant={variant}>
            {readabilityScore}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contentPost = row.original
        const blog = contentPost.blogs as { name: string; domain: string } | undefined
        const slug = contentPost.slug
        
        return (
          <div className="flex items-center space-x-2">
            {slug && blog?.domain && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://${blog.domain}/${slug}`, '_blank')}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ], [updateUrl])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: Math.ceil(total / perPage),
  })

  const totalPages = Math.ceil(total / perPage)
  const startItem = (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, total)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Content Posts ({total.toLocaleString()})</span>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateUrl({ search: globalFilter })
                  }
                }}
                className="pl-8 w-64"
              />
            </div>
            <Button
              onClick={() => updateUrl({ search: globalFilter })}
              size="sm"
            >
              Search
            </Button>
          </div>
        </CardTitle>
        
        <div className="flex items-center space-x-4">
          <Select
            value={searchParams.get('status') || 'all'}
            onValueChange={(value) => updateUrl({ status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="publish">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="trash">Trash</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No content posts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {total.toLocaleString()} posts
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrl({ page: (page - 1).toString() })}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrl({ page: (page + 1).toString() })}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}