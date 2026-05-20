'use client'

import { createContext, useContext, type ReactNode } from 'react'

type AdminSettingsContextValue = {
  openSettings: () => void
  onBack: () => void
}

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(null)

export function AdminSettingsProvider({
  value,
  children,
}: {
  value: AdminSettingsContextValue | null
  children: ReactNode
}) {
  return (
    <AdminSettingsContext.Provider value={value}>{children}</AdminSettingsContext.Provider>
  )
}

export function useAdminSettings() {
  return useContext(AdminSettingsContext)
}
