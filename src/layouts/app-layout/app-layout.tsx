'use client'

import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Menu, X, LogOut, Wallet, Mail, Search, List, FileText, Trash2, AlertTriangle, LoaderCircle, Megaphone, MessageSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import HeaderTitle from '@/components/header-title'
import Modal from '@/components/modal'
import useIsRouteMatch from '@/hooks/use-is-router-match'
import { getMe, requestAccountDeletion, type MeResponse } from '@/services/account'
import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import { legalDocuments, getLegalRoute } from '@/constants/legal'
import { clearAuthClientFlag } from '@/utils/auth-client-flag'

function formatCredits(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export default function AppLayout({ children }: PropsWithChildren) {
  const { push, back } = useRouter()
  const { isMatch, pathname } = useIsRouteMatch()
  const { status, data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deletionOpen, setDeletionOpen] = useState(false)
  const [deletionEmail, setDeletionEmail] = useState('')
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionAcknowledged, setDeletionAcknowledged] = useState(false)
  const [deletionError, setDeletionError] = useState<string | null>(null)
  const holdTimerRef = useRef<number | null>(null)

  const { data: me } = useQuery<MeResponse | null>({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: status === 'authenticated'
  })

  const deletionMutation = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: async (response) => {
      setDeletionError(null)
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          clearAuthClientFlag()
          void signOut({ redirect: true, callbackUrl: CONSULTAR_IMOVEL_INICIO_HREF })
        }, 1200)
      }
      return response
    },
    onError: (error: unknown) => {
      setDeletionError(error instanceof Error ? error.message : 'Não foi possível excluir a conta.')
    },
  })

  const isConsultas = pathname.startsWith('/consultas')
  const isAdminArea = pathname.startsWith('/admin')
  const currentEmail = me?.email ?? session?.user?.email ?? ''

  function handleGoBack() {
    if (pathname.startsWith('/admin/outreach/campaigns/')) {
      push('/admin/outreach')
      return
    }
    const mapRoutes: Record<string, string> = {
      '/consultas': CONSULTAR_IMOVEL_INICIO_HREF,
      '/admin/manual-review': '/consultas',
      '/admin/outreach': '/consultas',
      '/admin/chat': '/admin/outreach',
    }
    if (mapRoutes[pathname]) {
      push(mapRoutes[pathname])
    } else {
      back()
    }
  }

  function handleLogout() {
    setSidebarOpen(false)
    clearAuthClientFlag()
    signOut({ redirect: true, callbackUrl: '/consultas' })
  }

  const openDeletionModal = useCallback(() => {
    setDeletionEmail(currentEmail)
    setDeletionReason('')
    setDeletionAcknowledged(false)
    setDeletionError(null)
    setDeletionOpen(true)
  }, [currentEmail])

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const startHoldTimer = useCallback(() => {
    clearHoldTimer()
    holdTimerRef.current = window.setTimeout(() => {
      openDeletionModal()
    }, 1200)
  }, [clearHoldTimer, openDeletionModal])

  useEffect(() => {
    return () => {
      clearHoldTimer()
    }
  }, [clearHoldTimer])

  const canConfirmDeletion =
    deletionEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase() &&
    deletionAcknowledged &&
    !deletionMutation.isPending

  const handleConfirmDeletion = async () => {
    if (!currentEmail) {
      setDeletionError('Não foi possível identificar seu e-mail.')
      return
    }

    await deletionMutation.mutateAsync({
      email: currentEmail,
      reason: deletionReason.trim(),
    })
  }

  const headerTitle = useMemo(() => {
    if (isMatch('/consultas/:id')) {
      return <HeaderTitle>Sua consulta</HeaderTitle>
    }
    if (isMatch('/consultas/:id/visualizar')) {
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
    if (pathname.startsWith('/admin/manual-review')) {
      return <HeaderTitle>Fila manual</HeaderTitle>
    }
    if (pathname.startsWith('/admin/outreach')) {
      return <HeaderTitle>Divulgação</HeaderTitle>
    }
    if (pathname.startsWith('/admin/chat')) {
      return <HeaderTitle>Chat</HeaderTitle>
    }
    return <></>
  }, [isMatch, pathname])

  return (
    <section className="min-h-screen bg-white pb-6">
        <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-4.5 mb-6 relative">
            <div className="flex items-center justify-start shrink-0">
              <ChevronLeft
                onClick={handleGoBack}
                className="size-7 text-white cursor-pointer touch-manipulation"
                role="button"
                aria-label="Voltar"
              />
            </div>

            <div className="min-w-0 flex justify-center items-center px-1">
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

            <div className="flex items-center justify-end shrink-0">
              {(isConsultas || isAdminArea) ? (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 text-white hover:opacity-80 touch-manipulation"
                  aria-label="Abrir configurações"
                >
                  <Menu className="size-7" />
                </button>
              ) : (
                <span className="size-7 inline-block shrink-0" aria-hidden />
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
                  <button
                    type="button"
                    onPointerDown={startHoldTimer}
                    onPointerUp={clearHoldTimer}
                    onPointerCancel={clearHoldTimer}
                    onPointerLeave={clearHoldTimer}
                    onDoubleClick={openDeletionModal}
                    className="flex w-full items-center gap-2 text-left text-sm text-gray-600 touch-manipulation"
                    aria-label="Informações da conta"
                  >
                    <Mail className="size-4 shrink-0 text-gray-400" />
                    <span className="truncate">{me.email}</span>
                  </button>
                )}

                {/* Links úteis */}
                <nav className="space-y-1 pt-2">
                  <Link
                    href={CONSULTAR_IMOVEL_INICIO_HREF}
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
                  {(me?.is_staff || me?.is_superuser) && (
                    <Link
                      href="/admin/manual-review"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                    >
                      <ClipboardList className="size-5 text-primary shrink-0" />
                      Fila manual (equipe)
                    </Link>
                  )}
                  {me?.is_superuser && (
                    <>
                      <Link
                        href="/admin/outreach"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                      >
                        <Megaphone className="size-5 text-primary shrink-0" />
                        Divulgação (admin)
                      </Link>
                      <Link
                        href="/admin/chat"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                      >
                        <MessageSquare className="size-5 text-primary shrink-0" />
                        Chat (admin)
                      </Link>
                    </>
                  )}
                </nav>

                <div className="pt-4">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Institucional
                  </p>
                  <div className="space-y-1">
                    {legalDocuments.map((document) => (
                      <Link
                        key={document.slug}
                        href={getLegalRoute(document.slug)}
                        prefetch={false}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium touch-manipulation"
                      >
                        <FileText className="size-5 text-primary shrink-0" />
                        {document.title}
                      </Link>
                    ))}
                  </div>
                </div>
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

        <Modal
          open={deletionOpen}
          onClose={() => setDeletionOpen(false)}
          title="Desativar conta"
          content={
            <div className="flex min-h-full flex-col bg-white">
              <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <div className="space-y-1">
                    <p className="font-semibold">Atenção</p>
                    <p className="text-sm leading-6 text-amber-900">
                      Esta ação desativa sua conta imediatamente. Você precisará confirmar o e-mail da conta e informar o motivo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 px-4 py-5 sm:px-6">
                <div>
                  <label htmlFor="delete-account-email" className="mb-2 block text-sm font-medium text-gray-900">
                    Digite seu e-mail para confirmar
                  </label>
                  <input
                    id="delete-account-email"
                    type="email"
                    value={deletionEmail}
                    onChange={(event) => setDeletionEmail(event.target.value)}
                    placeholder={currentEmail}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="delete-account-reason" className="mb-2 block text-sm font-medium text-gray-900">
                    Motivo da solicitação
                  </label>
                  <textarea
                    id="delete-account-reason"
                    value={deletionReason}
                    onChange={(event) => setDeletionReason(event.target.value)}
                    placeholder="Opcional: descreva brevemente o motivo"
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={deletionAcknowledged}
                    onChange={(event) => setDeletionAcknowledged(event.target.checked)}
                    className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm leading-6 text-gray-700">
                    Entendo que esta ação desativa minha conta e que o acesso será encerrado imediatamente.
                  </span>
                </label>

                {deletionError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {deletionError}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setDeletionOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeletion}
                    disabled={!canConfirmDeletion}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletionMutation.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Desativar conta
                  </button>
                </div>
              </div>
            </div>
          }
        />
    </section>
  )
}
