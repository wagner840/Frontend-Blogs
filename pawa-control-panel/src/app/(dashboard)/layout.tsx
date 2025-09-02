'use client'

import { ReactElement, useState, useEffect } from 'react'
import { SideNav } from '@/components/shared/SideNav'
import { Button } from '@/components/ui/button'
import { SimpleThemeToggle } from '@/components/theme/theme-toggle'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps): ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen bg-background">
      <SideNav 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-card border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="ml-3 text-lg font-semibold">PAWA Control</h1>
            </div>
            <SimpleThemeToggle />
          </header>
        )}

        {/* Desktop Toggle Button */}
        {!isMobile && (
          <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="p-2"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <SimpleThemeToggle />
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto">
          <div className="container-fluid">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}