import { ReactElement } from 'react'
import { SideNav } from '@/components/shared/SideNav'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps): ReactElement {
  return (
    <div className="flex h-screen bg-background">
      <SideNav />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}