'use client'

import { useEffect, type ReactNode } from 'react'
import {
  ADMIN_SIDEBAR_STORAGE_KEY,
  useAdminSidebar,
} from '@/layouts/admin-workspace/admin-sidebar-context'

/** Recolhe a rail no inbox (mais espaço) e restaura ao sair — padrão SimpleTrack. */
function useAutoCollapseSidebar() {
  const sidebar = useAdminSidebar()
  const setCollapsed = sidebar?.setCollapsed
  const setMobileOpen = sidebar?.setMobileOpen

  useEffect(() => {
    if (!setCollapsed || !setMobileOpen) return

    let prev = false
    try {
      prev = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      prev = false
    }

    setCollapsed(true)
    setMobileOpen(false)

    return () => {
      setCollapsed(prev)
    }
  }, [setCollapsed, setMobileOpen])
}

export default function AdminInboxLayout({ children }: { children: ReactNode }) {
  useAutoCollapseSidebar()
  return <>{children}</>
}
