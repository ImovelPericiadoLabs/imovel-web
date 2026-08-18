import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  Headphones,
  LayoutGrid,
  LineChart,
  Megaphone,
  MessageSquare,
  Plug,
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

export type AdminNavSection = {
  id: string
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        href: '/consultas',
        label: 'Consultas',
        shortLabel: 'Consultas',
        icon: LayoutGrid,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operações',
    items: [
      {
        href: '/admin/manual-review',
        label: 'Fila manual',
        shortLabel: 'Fila',
        icon: ClipboardList,
        staffOnly: true,
      },
      {
        href: '/admin/partners',
        label: 'Parceiros API',
        shortLabel: 'Parceiros API',
        icon: Plug,
        staffOnly: true,
      },
      {
        href: '/admin/partner-accounts',
        label: 'Contas de teste',
        shortLabel: 'Contas teste',
        icon: UserPlus,
        staffOnly: true,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Financeiro',
    items: [
      {
        href: '/admin/finance',
        label: 'Custos & receita',
        shortLabel: 'Financeiro',
        icon: LineChart,
        staffOnly: true,
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Chat',
    items: [
      {
        href: '/admin/inbox',
        label: 'Inbox suporte',
        shortLabel: 'Suporte',
        icon: Headphones,
        staffOnly: true,
      },
      {
        href: '/admin/chat',
        label: 'Inbox campanhas',
        shortLabel: 'Chat',
        icon: MessageSquare,
        superuserOnly: true,
      },
    ],
  },
  {
    id: 'automations',
    label: 'Automações',
    items: [
      {
        href: '/admin/outreach',
        label: 'Campanhas',
        shortLabel: 'Outreach',
        icon: Megaphone,
        superuserOnly: true,
      },
    ],
  },
]

export function filterAdminNavSections(
  isStaff: boolean,
  isSuperuser: boolean,
): AdminNavSection[] {
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.superuserOnly) return isSuperuser
      if (item.staffOnly) return isStaff || isSuperuser
      return true
    }),
  })).filter((s) => s.items.length > 0)
}

/** Lista plana (meta / mobile). */
export function filterAdminNav(isStaff: boolean, isSuperuser: boolean): AdminNavItem[] {
  return filterAdminNavSections(isStaff, isSuperuser).flatMap((s) => s.items)
}

export function resolveAdminPageMeta(pathname: string): {
  title: string
  section: string
  eyebrow?: string
} {
  if (pathname.startsWith('/admin/outreach/campaigns/')) {
    return { section: 'Automações', title: 'Editor de campanha', eyebrow: 'Outreach' }
  }
  for (const group of ADMIN_NAV_SECTIONS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return { section: group.label, title: item.label, eyebrow: 'Imóvel Periciado' }
      }
    }
  }
  return { section: 'Operações', title: 'Admin', eyebrow: 'Imóvel Periciado' }
}
