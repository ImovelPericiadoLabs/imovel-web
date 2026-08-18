'use client'

import { ChevronLeft, Menu, PanelLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveAdminPageMeta } from '@/layouts/admin-workspace/admin-nav'
import { useAdminSettings } from '@/layouts/admin-workspace/admin-settings-context'
import { useAdminSidebar } from '@/layouts/admin-workspace/admin-sidebar-context'
import { cn } from '@/utils/tailwind'
import { ADMIN_ICON_BTN, ADMIN_TOPBAR, ADMIN_TOPBAR_ACCENT } from './admin-styles'

type Props = {
  /** Inbox/chat: breadcrumb mais enxuto, botão de recolher rail no desktop. */
  compact?: boolean
}

export default function AdminTopbar({ compact = false }: Props) {
  const pathname = usePathname()
  const settings = useAdminSettings()
  const sidebar = useAdminSidebar()
  const { title, section, eyebrow } = resolveAdminPageMeta(pathname)
  const collapsed = sidebar?.collapsed ?? false

  return (
    <header className={ADMIN_TOPBAR}>
      <span className={ADMIN_TOPBAR_ACCENT} aria-hidden />

      <button
        type="button"
        onClick={() => sidebar?.toggleMobileOpen()}
        className={cn(ADMIN_ICON_BTN, 'lg:hidden')}
        aria-label="Abrir menu"
      >
        <PanelLeft className="size-4" />
      </button>

      {!compact ? (
        <button
          type="button"
          onClick={() => settings?.onBack()}
          className={cn(ADMIN_ICON_BTN, 'lg:hidden')}
          aria-label="Voltar"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => sidebar?.toggleCollapsed()}
        className={cn(ADMIN_ICON_BTN, 'hidden lg:inline-flex')}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>

      <div className="min-w-0 flex-1 pl-1">
        <nav
          className={cn(
            'flex items-center gap-1.5 text-[10px] font-medium text-[#9497a9]',
            compact && 'sm:gap-2',
          )}
          aria-label="Contexto"
        >
          {eyebrow && !compact ? (
            <span className="hidden rounded bg-[rgba(133,91,251,0.12)] px-1.5 py-0.5 font-bold uppercase tracking-wide text-[#5741d8] sm:inline">
              {eyebrow}
            </span>
          ) : null}
          <span className="hidden text-[#686b82] sm:inline">{section}</span>
          <span className="hidden opacity-40 sm:inline" aria-hidden>
            /
          </span>
          <span className="truncate text-[#101114]">{title}</span>
        </nav>
        {!compact ? (
          <h1 className="truncate text-base font-bold tracking-tight text-[#101114]">{title}</h1>
        ) : (
          <h1 className="truncate text-sm font-bold tracking-tight text-[#101114] sm:hidden">
            {title}
          </h1>
        )}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="h-6 w-px bg-[#dedee5]" aria-hidden />
        <Link
          href="/consultas"
          className="text-xs font-semibold text-[#686b82] transition hover:text-[#7132f5]"
        >
          App cliente
        </Link>
      </div>

      <button
        type="button"
        onClick={() => settings?.openSettings()}
        className={ADMIN_ICON_BTN}
        aria-label="Conta"
      >
        <Menu className="size-4" />
      </button>
    </header>
  )
}
