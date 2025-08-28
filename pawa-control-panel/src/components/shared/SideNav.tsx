'use client'

import { ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  FileText, 
  Search,
  Home
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    name: 'Keywords',
    href: '/keywords',
    icon: Search
  },
  {
    name: 'Content',
    href: '/content',
    icon: FileText
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  }
]

export function SideNav(): ReactElement {
  const pathname = usePathname()

  return (
    <nav className="w-64 bg-card border-r border-border p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">PAWA Control</h1>
        <p className="text-sm text-muted-foreground">SEO Dashboard</p>
      </div>

      <ul className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}