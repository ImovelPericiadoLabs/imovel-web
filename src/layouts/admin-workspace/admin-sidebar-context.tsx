'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'imovel-admin-sidebar-collapsed'

export { STORAGE_KEY as ADMIN_SIDEBAR_STORAGE_KEY }

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
    setCollapsedState((cur) => {
      const next = !cur
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const toggleMobileOpen = useCallback(() => {
    setMobileOpen((o) => !o)
  }, [])

  const value = useMemo<AdminSidebarContextValue>(
    () => ({
      collapsed: hydrated ? collapsed : false,
      mobileOpen,
      setCollapsed,
      toggleCollapsed,
      setMobileOpen,
      toggleMobileOpen,
    }),
    [hydrated, collapsed, mobileOpen, setCollapsed, toggleCollapsed, toggleMobileOpen],
  )

  return (
    <AdminSidebarContext.Provider value={value}>{children}</AdminSidebarContext.Provider>
  )
}

export function useAdminSidebar() {
  return useContext(AdminSidebarContext)
}
