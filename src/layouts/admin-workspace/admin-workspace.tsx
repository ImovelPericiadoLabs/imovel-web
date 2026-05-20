'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/tailwind'
import { getMe } from '@/services/account'
import { filterAdminNav } from './admin-nav'

type Props = {
  children: ReactNode
}

export default function AdminWorkspace({ children }: Props) {
  const pathname = usePathname()
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })

  const isStaff = Boolean(me?.is_staff || me?.is_superuser)
  const isSuperuser = Boolean(me?.is_superuser)
  const nav = filterAdminNav(isStaff, isSuperuser)

  if (!isStaff && !isSuperuser) {
    return <div className="px-4 py-6 lg:px-8">{children}</div>
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F6F5FA]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col lg:flex-row">
        <aside
          className="hidden shrink-0 border-b border-[#dedee5] bg-white lg:flex lg:w-56 lg:flex-col lg:border-b-0 lg:border-r xl:w-60"
          aria-label="Navegação administrativa"
        >
          <div className="border-b border-[#dedee5] px-4 py-4">
            <Link href="/consultas" className="flex items-center gap-2.5">
              <Image
                src="/images/logo.svg"
                alt="Imóvel Periciado"
                width={36}
                height={36}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-[#9497a9]">
                  Admin
                </p>
                <p className="truncate text-sm font-bold text-[#101114]">Operações</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5 p-3">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[rgba(133,91,251,0.12)] text-[#5741d8]'
                      : 'text-[#686b82] hover:bg-[rgba(148,151,169,0.08)] hover:text-[#101114]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={cn('size-[18px] shrink-0', active && 'text-[#7132f5]')}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-[#dedee5] bg-white px-3 py-2 lg:hidden"
          aria-label="Navegação administrativa"
        >
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-[rgba(133,91,251,0.12)] text-[#5741d8]'
                    : 'text-[#686b82]',
                )}
              >
                {item.shortLabel}
              </Link>
            )
          })}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
