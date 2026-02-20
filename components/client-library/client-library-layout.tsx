'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PanelLeft, PanelLeftClose, Menu } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { LibrarySidebarContent, SIDEBAR_WIDTH } from './library-sidebar-content'
import { LibraryFooter } from './library-footer'
import { cn } from '@/lib/utils'

type LibraryLayoutContextValue = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
}

const LibraryLayoutContext = React.createContext<LibraryLayoutContextValue | null>(null)

export function useLibraryLayout() {
  const ctx = React.useContext(LibraryLayoutContext)
  if (!ctx) throw new Error('useLibraryLayout must be used within ClientLibraryLayout')
  return ctx
}

export function ClientLibraryLayout({
  children,
  header,
}: {
  children: React.ReactNode
  header: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  // On desktop, start with sidebar open; on mobile, start closed
  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const contextValue: LibraryLayoutContextValue = {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
  }

  return (
    <LibraryLayoutContext.Provider value={contextValue}>
      <div
        className="flex h-screen flex-col overflow-hidden bg-background"
        style={{ '--library-sidebar-width': SIDEBAR_WIDTH } as React.CSSProperties}
      >
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop sidebar - not scrollable, border aligns with header */}
          <aside
            className={cn(
              'hidden shrink-0 overflow-y-hidden overflow-x-hidden border-r border-border bg-white transition-[width] duration-200 ease-in-out md:flex md:flex-col min-h-0',
              sidebarOpen ? 'w-(--library-sidebar-width)' : 'w-0'
            )}
          >
            {sidebarOpen && <LibrarySidebarContent />}
          </aside>

          {/* Mobile sidebar (Sheet) - only open on mobile; overlay closes on outside click */}
          <Sheet open={isMobile ? sidebarOpen : false} onOpenChange={setSidebarOpen}>
            <SheetContent
              side="left"
              className="w-(--library-sidebar-width) border-r border-border bg-white p-0 [&>button]:hidden overflow-hidden flex flex-col min-h-0 max-h-full h-full"
            >
              <LibrarySidebarContent />
            </SheetContent>
          </Sheet>

          {/* Main: header + scrollable body; footer stuck at bottom */}
          <main className="flex min-w-0 flex-1 flex-col min-h-0">
            {header}
            <div className="flex flex-1 min-h-0 min-w-0 flex-col bg-[#F9F9F9]">
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
                {children}
              </div>
              <div className="shrink-0">
                <LibraryFooter />
              </div>
            </div>
          </main>
        </div>
      </div>
    </LibraryLayoutContext.Provider>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar, sidebarOpen, isMobile } = useLibraryLayout()
  const Icon = isMobile ? Menu : (sidebarOpen ? PanelLeftClose : PanelLeft)
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
