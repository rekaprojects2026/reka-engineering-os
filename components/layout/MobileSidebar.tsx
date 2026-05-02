'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent, type SidebarShellProps } from '@/components/layout/AppSidebar'

export function MobileSidebar(props: Omit<SidebarShellProps, 'onNavigate'>) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={18} aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton
        className="w-[var(--sidebar-drawer-max-w)] max-w-[100vw] overflow-x-hidden border-0 p-0 sm:max-w-[min(20rem,calc(100vw-1rem))]"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        <SheetTitle className="sr-only">Main navigation</SheetTitle>
        <SidebarContent {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
