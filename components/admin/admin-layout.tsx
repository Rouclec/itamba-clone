'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PanelLeft, PanelLeftClose, Menu } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AdminSidebarContent, ADMIN_SIDEBAR_WIDTH } from './admin-sidebar'
import { cn } from '@/lib/utils'

type AdminLayoutContextValue = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
}

const AdminLayoutContext = React.createContext<AdminLayoutContextValue | null>(null)

export function useAdminLayout() {
  const ctx = React.useContext(AdminLayoutContext)
  if (!ctx) throw new Error('useAdminLayout must be used within AdminLayout')
  return ctx
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const contextValue: AdminLayoutContextValue = {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
  }

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      <div
        className="flex h-screen flex-col overflow-hidden bg-background"
        style={{ '--admin-sidebar-width': ADMIN_SIDEBAR_WIDTH } as React.CSSProperties}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <aside
            className={cn(
              'hidden shrink-0 overflow-y-hidden overflow-x-hidden border-r border-border bg-white transition-[width] duration-200 ease-in-out md:flex md:flex-col min-h-0',
              sidebarOpen ? 'w-(--admin-sidebar-width)' : 'w-0'
            )}
          >
            {sidebarOpen && <AdminSidebarContent />}
          </aside>

          <Sheet open={isMobile ? sidebarOpen : false} onOpenChange={setSidebarOpen}>
            <SheetContent
              side="left"
              className="w-(--admin-sidebar-width) border-r border-border bg-white p-0 [&>button]:hidden overflow-hidden flex flex-col min-h-0 max-h-full h-full"
            >
              <AdminSidebarContent />
            </SheetContent>
          </Sheet>

          <main className="flex min-w-0 flex-1 flex-col min-h-0">{children}</main>
        </div>
      </div>
    </AdminLayoutContext.Provider>
  )
}

export function AdminSidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, sidebarOpen, isMobile } = useAdminLayout()
  const Icon = isMobile ? Menu : sidebarOpen ? PanelLeftClose : PanelLeft
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        'flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-hover',
        className
      )}
      aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <Icon className="size-5" />
    </button>
  )
}
