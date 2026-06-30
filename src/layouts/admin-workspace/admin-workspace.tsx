'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/services/account'
import AdminTopbar from '@/components/admin/admin-topbar'
import { ADMIN_SHELL, ADMIN_WORKSPACE } from '@/components/admin/admin-styles'
import AdminSidebar from './admin-sidebar'
import { AdminSidebarProvider } from './admin-sidebar-context'

type Props = {
  children: ReactNode
}

export default function AdminWorkspace({ children }: Props) {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })

  const isStaff = Boolean(me?.is_staff || me?.is_superuser)
  const isSuperuser = Boolean(me?.is_superuser)

  if (!isStaff && !isSuperuser) {
    return <div className="px-4 py-5">{children}</div>
  }

  return (
    <AdminSidebarProvider>
      <div className={ADMIN_SHELL}>
        <AdminSidebar isStaff={isStaff} isSuperuser={isSuperuser} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className={ADMIN_WORKSPACE}>{children}</main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}
