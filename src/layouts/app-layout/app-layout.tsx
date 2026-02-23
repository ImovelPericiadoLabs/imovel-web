'use client'

import { PropsWithChildren, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Menu, X, LogOut, Wallet, Mail, Search, List } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import HeaderTitle from '@/components/header-title'
import useIsRouteMatch from '@/hooks/use-is-router-match'
import { Providers } from '@/providers/'
import { getMe, type MeResponse } from '@/services/account'

function formatCredits(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export default function AppLayout({ children }: PropsWithChildren) {
  const { push, back } = useRouter()
  const { isMatch, pathname } = useIsRouteMatch()
  const { status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: me } = useQuery<MeResponse | null>({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: status === 'authenticated'
  })

  const isConsultas = pathname.startsWith('/consultas')

  function handleGoBack() {
    const mapRoutes: Record<string, string> = {
      '/consultas': '/consultar-imovel'
    }
    if (mapRoutes[pathname]) {
      push(mapRoutes[pathname])
    } else {
      back()
    }
  }

  function handleLogout() {
    setSidebarOpen(false)
    signOut({ redirect: true, callbackUrl: '/consultas' })
  }

  const headerTitle = useMemo(() => {
    if (isMatch('/consultas/:id')) {
      return <HeaderTitle>Resultado da consulta</HeaderTitle>
    }
    if (isMatch('/consultas/:id/opcoes')) {
      return <HeaderTitle>Resultado da consulta</HeaderTitle>
    }
    if (isMatch('/consultas/:id/opcoes/resultado')) {
      return <HeaderTitle>Resultado completo</HeaderTitle>
    }
    if (isMatch('/consultas/:id/opcoes/documentos')) {
      return <HeaderTitle>Documentos</HeaderTitle>
    }
    if (isMatch('/consultas/:id/opcoes/proprietarios')) {
      return <HeaderTitle>Proprietários</HeaderTitle>
    }
    return <></>
  }, [isMatch])

  return (
    <Providers>
      <section className="min-h-screen bg-white pb-6">
        <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
          <div className="flex items-center justify-between py-4.5 mb-6 relative">
            <div className="flex items-center gap-3.5 min-w-0 flex-1 justify-start">
              <ChevronLeft
                onClick={handleGoBack}
                className="size-7 text-white cursor-pointer shrink-0 touch-manipulation"
                role="button"
                aria-label="Voltar"
              />
              {headerTitle}
            </div>

            {/* Logo centralizada com posicionamento absoluto para não ser deslocada pelos créditos */}
            {pathname === '/consultas' && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <Image
                  src="/images/logo.svg"
                  alt="Logo Imóvel Periciado"
                  width={72}
                  height={70}
                  className="object-contain -my-2.5"
                />
              </div>
            )}

            <div className="flex items-center min-w-0 flex-1 justify-end">
              {isConsultas && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 text-white hover:opacity-80 shrink-0 touch-manipulation"
                  aria-label="Abrir configurações"
                >
                  <Menu className="size-7" />
                </button>
              )}
            </div>
          </div>
        </header>

        {children}

        {/* Painel lateral: configuração e logout */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
            <aside
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200"
              role="dialog"
              aria-label="Configurações"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Configurações</h2>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation"
                  aria-label="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Saldo de créditos */}
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                    <Wallet className="size-5 shrink-0" />
                    <span>Saldo de créditos</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">
                    {me != null && typeof me.credits_balance === 'number'
                      ? `R$ ${formatCredits(me.credits_balance)}`
                      : '--'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use para consultas e complementos de laudo.
                  </p>
                </div>

                {/* E-mail da conta */}
                {me?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4 shrink-0 text-gray-400" />
                    <span className="truncate">{me.email}</span>
                  </div>
                )}

                {/* Links úteis */}
                <nav className="space-y-1 pt-2">
                  <Link
                    href="/consultar-imovel"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                  >
                    <Search className="size-5 text-primary shrink-0" />
                    Nova consulta
                  </Link>
                  <Link
                    href="/consultas"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                  >
                    <List className="size-5 text-primary shrink-0" />
                    Minhas consultas
                  </Link>
                </nav>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg font-medium touch-manipulation"
                >
                  <LogOut className="size-5" />
                  Sair da conta
                </button>
              </div>
            </aside>
          </>
        )}
      </section>
    </Providers>
  )
}
