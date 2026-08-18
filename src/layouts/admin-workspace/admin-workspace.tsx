'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/services/account'
import AdminTopbar from '@/components/admin/admin-topbar'
import {
  ADMIN_SHELL,
  ADMIN_WORKSPACE,
  ADMIN_WORKSPACE_LOCKED,
} from '@/components/admin/admin-styles'
import AdminSidebar from './admin-sidebar'
import { AdminSidebarProvider } from './admin-sidebar-context'

type Props = {
  children: ReactNode
}

/** Páginas que scrollam por painel interno (não no main). */
function isPanelLockedPath(pathname: string) {
  return pathname.startsWith('/admin/inbox') || pathname.startsWith('/admin/chat')
}

export default function AdminWorkspace({ children }: Props) {
  const pathname = usePathname() ?? ''
  const panelLocked = isPanelLockedPath(pathname)
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar compact={panelLocked} />
          <main className={panelLocked ? ADMIN_WORKSPACE_LOCKED : ADMIN_WORKSPACE}>
            {children}
          </main>
        </div>
      </div>
    </AdminSidebarProvider>
  )
}
