'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronLeft,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { getMe } from '@/services/account'
import {
  ADMIN_NAV_LINK,
  ADMIN_NAV_LINK_ACTIVE,
  ADMIN_NAV_RAIL,
  ADMIN_NAV_SECTION,
  ADMIN_SIDEBAR,
  ADMIN_SIDEBAR_BRAND,
  ADMIN_SIDEBAR_GLOW,
} from '@/components/admin/admin-styles'
import { filterAdminNavSections } from './admin-nav'
import { useAdminSidebar } from './admin-sidebar-context'

type Props = {
  isStaff: boolean
  isSuperuser: boolean
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  external,
  onNavigate,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  external?: boolean
  onNavigate?: () => void
}) {
  const className = cn(
    ADMIN_NAV_LINK,
    active && ADMIN_NAV_LINK_ACTIVE,
    collapsed && 'justify-center px-2',
    'pl-3',
  )

  const inner = (
    <>
      {active && !collapsed && <span className={ADMIN_NAV_RAIL} aria-hidden />}
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          active
            ? 'bg-[rgba(113,50,245,0.35)] text-white'
            : 'bg-[rgba(255,255,255,0.04)] text-[rgba(232,233,242,0.7)] group-hover:bg-[rgba(255,255,255,0.08)] group-hover:text-white',
        )}
      >
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {external && <ExternalLink className="size-3 shrink-0 opacity-35" aria-hidden />}
        </>
      )}
    </>
  )

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={className}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      {inner}
    </Link>
  )
}

function SidebarChrome({
  collapsed,
  sections,
  pathname,
  onNavigate,
  onToggleCollapse,
  showCollapse,
}: {
  collapsed: boolean
  sections: ReturnType<typeof filterAdminNavSections>
  pathname: string
  onNavigate?: () => void
  onToggleCollapse?: () => void
  showCollapse?: boolean
}) {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const email = me?.email?.split('@')[0] ?? 'Operador'

  return (
    <>
      <div className={ADMIN_SIDEBAR_GLOW} aria-hidden />
      <div className={cn(ADMIN_SIDEBAR_BRAND, collapsed && 'justify-center px-2')}>
        <Link
          href="/consultas"
          onClick={onNavigate}
          className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(113,50,245,0.25)] ring-1 ring-[rgba(113,50,245,0.45)]">
            <Image src="/images/logo.svg" alt="Imóvel Periciado" width={26} height={26} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9497a9]">
                <Sparkles className="size-3 text-[#7132f5]" aria-hidden />
                Command Center
              </p>
              <p className="truncate text-sm font-bold tracking-tight text-white">Imóvel Periciado</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="relative z-10 flex-1 space-y-5 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.id}>
            {!collapsed && <p className={ADMIN_NAV_SECTION}>{section.label}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const external = !item.href.startsWith('/admin')
                const active = external
                  ? pathname.startsWith('/consultas')
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <SidebarNavItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      collapsed={collapsed}
                      external={external}
                      onNavigate={onNavigate}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative z-10 space-y-1 border-t border-[rgba(255,255,255,0.06)] p-2">
        {!collapsed && (
          <div className="mb-1 flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.04)] px-2.5 py-2 ring-1 ring-[rgba(255,255,255,0.06)]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[rgba(113,50,245,0.3)] text-xs font-bold text-white">
              {email.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{email}</p>
              <p className="text-[10px] text-[#9497a9]">Staff</p>
            </div>
            <Settings className="size-3.5 shrink-0 text-[#9497a9]" aria-hidden />
          </div>
        )}
        {showCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(ADMIN_NAV_LINK, 'w-full', collapsed && 'justify-center px-2')}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" aria-hidden />
                <span className="text-xs">Recolher rail</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  )
}

export default function AdminSidebar({ isStaff, isSuperuser }: Props) {
  const pathname = usePathname()
  const sidebar = useAdminSidebar()
  const collapsed = sidebar?.collapsed ?? false
  const sections = filterAdminNavSections(isStaff, isSuperuser)

  return (
    <>
      {sidebar?.mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#0b1b3a]/60 backdrop-blur-sm lg:hidden"
          aria-label="Fechar menu"
          onClick={() => sidebar.setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(ADMIN_SIDEBAR, collapsed ? 'w-[4.5rem]' : 'w-[15.5rem] xl:w-64')}
        aria-label="Navegação administrativa"
      >
        <SidebarChrome
          collapsed={collapsed}
          sections={sections}
          pathname={pathname}
          onToggleCollapse={() => sidebar?.toggleCollapsed()}
          showCollapse
        />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col bg-[#0f1220] shadow-[4px_0_32px_rgba(11,27,58,0.25)] transition-transform duration-[240ms] ease-in-out lg:hidden',
          sidebar?.mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Menu administrativo"
      >
        <div className="relative flex h-12 items-center justify-end border-b border-[rgba(255,255,255,0.06)] px-2">
          <button
            type="button"
            className="rounded-lg p-2 text-[#9497a9] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
            onClick={() => sidebar?.setMobileOpen(false)}
            aria-label="Fechar"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>
        <SidebarChrome
          collapsed={false}
          sections={sections}
          pathname={pathname}
          onNavigate={() => sidebar?.setMobileOpen(false)}
        />
      </aside>
    </>
  )
}
