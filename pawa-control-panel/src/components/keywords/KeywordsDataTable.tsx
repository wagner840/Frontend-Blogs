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
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface MainKeyword {
  id: string
  keyword: string
  msv: number
  kw_difficulty: number
  cpc: number
  competition: string
  search_intent: string
  is_used: boolean
  blogs?: {
    name: string
    domain: string
  }
}

interface KeywordsDataTableProps {
  data: MainKeyword[]
  total: number
  page: number
  perPage: number
}

export function KeywordsDataTable({ 
  data, 
  total, 
  page, 
  perPage 
}: KeywordsDataTableProps): ReactElement {
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
    
    router.push(`/keywords?${params.toString()}`)
  }, [router, searchParams])

  const columns: ColumnDef<MainKeyword>[] = useMemo(() => [
    {
      accessorKey: 'keyword',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'keyword.asc' : 'keyword.desc' })}
          className="h-8 px-2"
        >
          Keyword
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
        const keyword = row.getValue('keyword') as string
        const keywordId = row.original.id
        
        return (
          <div className="flex items-center space-x-2">
            <Link 
              href={`/keywords/${keywordId}`}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline max-w-xs truncate"
            >
              {keyword || '-'}
            </Link>
            <Link href={`/keywords/${keywordId}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        )
      },
    },
    {
      accessorKey: 'blogs.name',
      header: 'Blog',
      cell: ({ row }) => {
        const blog = row.original.blogs
        return (
          <Badge variant="outline">
            {blog?.name || 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'msv',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'msv.asc' : 'msv.desc' })}
          className="h-8 px-2"
        >
          MSV
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
        const msv = row.getValue('msv') as number | null
        return <div className="text-right">{msv?.toLocaleString() || '-'}</div>
      },
    },
    {
      accessorKey: 'kw_difficulty',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'kw_difficulty.asc' : 'kw_difficulty.desc' })}
          className="h-8 px-2"
        >
          KD
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
        const kd = row.getValue('kw_difficulty') as number | null
        return (
          <Badge 
            variant={kd && kd < 30 ? 'default' : kd && kd < 60 ? 'secondary' : 'destructive'}
          >
            {kd || '-'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'search_intent',
      header: 'Intent',
      cell: ({ row }) => {
        const intent = row.getValue('search_intent') as string | null
        return (
          <Badge variant="outline">
            {intent || 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'cpc',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => updateUrl({ sort: column.getIsSorted() === 'desc' ? 'cpc.asc' : 'cpc.desc' })}
          className="h-8 px-2"
        >
          CPC
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
        const cpc = row.getValue('cpc') as number | null
        return (
          <div className="text-right font-mono">
            ${cpc?.toFixed(2) || '0.00'}
          </div>
        )
      },
    },
    {
      accessorKey: 'competition',
      header: 'Competition',
      cell: ({ row }) => {
        const competition = row.getValue('competition') as string | null
        return (
          <Badge variant="outline">
            {competition || 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'is_used',
      header: 'Status',
      cell: ({ row }) => {
        const isUsed = row.getValue('is_used') as boolean | null
        return (
          <Badge variant={isUsed ? 'secondary' : 'default'}>
            {isUsed ? 'Used' : 'Available'}
          </Badge>
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
        <CardTitle className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <span>Keywords ({total.toLocaleString()})</span>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateUrl({ search: globalFilter })
                  }
                }}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            <Button
              onClick={() => updateUrl({ search: globalFilter })}
              size="sm"
              className="w-full sm:w-auto"
            >
              Search
            </Button>
          </div>
        </CardTitle>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={searchParams.get('blog_name') || 'all'}
            onValueChange={(value) => updateUrl({ blog_name: value })}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Blogs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blogs</SelectItem>
              <SelectItem value="Optemil">Optemil</SelectItem>
              <SelectItem value="Einsof7">Einsof7</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get('search_intent') || 'all'}
            onValueChange={(value) => updateUrl({ search_intent: value })}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Intents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intents</SelectItem>
              <SelectItem value="informational">Informational</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
              <SelectItem value="navigational">Navigational</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get('competition') || 'all'}
            onValueChange={(value) => updateUrl({ competition: value })}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get('is_used') || 'all'}
            onValueChange={(value) => updateUrl({ is_used: value })}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="false">Available</SelectItem>
              <SelectItem value="true">Used</SelectItem>
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
        <div className="table-responsive">
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {total.toLocaleString()} keywords
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