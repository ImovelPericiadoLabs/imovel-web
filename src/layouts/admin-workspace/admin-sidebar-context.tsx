'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'imovel-admin-sidebar-collapsed'

type AdminSidebarContextValue = {
  collapsed: boolean
  mobileOpen: boolean
  setCollapsed: (v: boolean) => void
  toggleCollapsed: () => void
  setMobileOpen: (v: boolean) => void
  toggleMobileOpen: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextValue | null>(null)

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === '1') setCollapsedState(true)
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v)
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  const value: AdminSidebarContextValue = {
    collapsed: hydrated ? collapsed : false,
    mobileOpen,
    setCollapsed,
    toggleCollapsed,
    setMobileOpen,
    toggleMobileOpen: () => setMobileOpen((o) => !o),
  }

  return (
    <AdminSidebarContext.Provider value={value}>{children}</AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  return useContext(AdminSidebarContext)
}
