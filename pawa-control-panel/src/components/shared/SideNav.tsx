'use client'

import { ReactElement } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  FileText, 
  Search,
  Home,
  X
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

interface SideNavProps {
  isOpen?: boolean
  onToggle?: () => void
  isMobile?: boolean
}

export function SideNav({ isOpen = true, onToggle, isMobile = false }: SideNavProps): ReactElement {
  const pathname = usePathname()

  if (isMobile) {
    return (
      <>
        {/* Mobile Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onToggle}
          />
        )}
        
        {/* Mobile Sidebar */}
        <nav className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out",
          "w-64 p-6",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-foreground">PAWA Control</h1>
              <p className="text-sm text-muted-foreground">SEO Dashboard</p>
            </div>
            <button 
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onToggle}
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
      </>
    )
  }

  // Desktop Sidebar
  return (
    <nav className="bg-card border-r border-border transition-all duration-300 ease-in-out" 
         style={{ 
           width: isOpen ? '16rem' : '4rem',
           minWidth: isOpen ? '16rem' : '4rem'
         }}>
      <div className="p-6">
        <div className="mb-8">
          {isOpen ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">PAWA Control</h1>
              <p className="text-sm text-muted-foreground">SEO Dashboard</p>
            </>
          ) : (
            <h1 className="text-xl font-bold text-foreground text-center">P</h1>
          )}
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
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isOpen ? 'space-x-3' : 'justify-center',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={!isOpen ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}