'use client'

import { ChevronLeft, Menu, PanelLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveAdminPageMeta } from '@/layouts/admin-workspace/admin-nav'
import { useAdminSettings } from '@/layouts/admin-workspace/admin-settings-context'
import { useAdminSidebar } from '@/layouts/admin-workspace/admin-sidebar-context'
import { ADMIN_ICON_BTN, ADMIN_TOPBAR, ADMIN_TOPBAR_ACCENT } from './admin-styles'

export default function AdminTopbar() {
  const pathname = usePathname()
  const settings = useAdminSettings()
  const sidebar = useAdminSidebar()
  const { title, section, eyebrow } = resolveAdminPageMeta(pathname)

  return (
    <header className={ADMIN_TOPBAR}>
      <span className={ADMIN_TOPBAR_ACCENT} aria-hidden />

      <button
        type="button"
        onClick={() => sidebar?.toggleMobileOpen()}
        className={`${ADMIN_ICON_BTN} lg:hidden`}
        aria-label="Abrir menu"
      >
        <PanelLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => settings?.onBack()}
        className={`${ADMIN_ICON_BTN} lg:hidden`}
        aria-label="Voltar"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="min-w-0 flex-1 pl-1">
        <nav className="flex items-center gap-1.5 text-[10px] font-medium text-[#9497a9]" aria-label="Contexto">
          {eyebrow && (
            <span className="hidden rounded bg-[rgba(133,91,251,0.12)] px-1.5 py-0.5 font-bold uppercase tracking-wide text-[#5741d8] sm:inline">
              {eyebrow}
            </span>
          )}
          <span className="text-[#686b82]">{section}</span>
          <span className="opacity-40" aria-hidden>
            /
          </span>
          <span className="truncate text-[#101114]">{title}</span>
        </nav>
        <h1 className="truncate text-base font-bold tracking-tight text-[#101114]">{title}</h1>
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
