import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Megaphone,
  MessageSquare,
  UserPlus,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
  staffOnly?: boolean
  superuserOnly?: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: '/admin/manual-review',
    label: 'Fila manual',
    shortLabel: 'Fila',
    icon: ClipboardList,
    staffOnly: true,
  },
  {
    href: '/admin/partner-accounts',
    label: 'Contas parceiros',
    shortLabel: 'Parceiros',
    icon: UserPlus,
    staffOnly: true,
  },
  {
    href: '/admin/outreach',
    label: 'Divulgação',
    shortLabel: 'Outreach',
    icon: Megaphone,
    superuserOnly: true,
  },
  {
    href: '/admin/chat',
    label: 'Chat',
    shortLabel: 'Chat',
    icon: MessageSquare,
    superuserOnly: true,
  },
]

export function filterAdminNav(isStaff: boolean, isSuperuser: boolean): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => {
    if (item.superuserOnly) return isSuperuser
    if (item.staffOnly) return isStaff || isSuperuser
    return true
  })
}
