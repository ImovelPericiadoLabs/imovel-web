'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import Alert from '@/components/alert'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminEmptyState,
  AdminPageShell,
  AdminStaffGate,
  AdminStatusBadge,
  ADMIN_CARD,
  type AdminTableColumn,
} from '@/components/admin'
import {
  deletePartnerAccount,
  getPartnerAccount,
  listPartnerAccounts,
  type PartnerAccount,
} from '@/services/staff/partner-accounts'
import PartnerCreateForm from './partner-create-form'
import PartnerDetailPanel from './partner-detail-panel'
import { formatBRL, formatDate, partnerDisplayName } from './partner-utils'

type Mode = 'idle' | 'create' | 'view'

export default function PartnerAccountsView() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [mode, setMode] = useState<Mode>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartnerAccount | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  )

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const listQuery = useQuery({
    queryKey: ['partner-accounts', page, searchDebounced],
    queryFn: () => listPartnerAccounts(page, searchDebounced),
  })

  const detailQuery = useQuery({
    queryKey: ['partner-account-detail', selectedId],
    queryFn: () => getPartnerAccount(selectedId as string),
    enabled: Boolean(selectedId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePartnerAccount(id),
    onSuccess: async (_, id) => {
      setDeleteTarget(null)
      if (selectedId === id) {
        setSelectedId(null)
        setMode('idle')
      }
      setFeedback({
        kind: 'success',
        message: 'Conta de parceiro removida. O acesso foi desativado.',
      })
      await queryClient.invalidateQueries({ queryKey: ['partner-accounts'] })
      await queryClient.removeQueries({ queryKey: ['partner-account-detail', id] })
    },
    onError: (err: unknown) => {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível remover a conta.',
      })
    },
  })

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['partner-accounts'] })

  const columns = useMemo((): AdminTableColumn<PartnerAccount>[] => {
    return [
      {
        key: 'partner',
        header: 'Parceiro',
        render: (row) => (
          <div className="min-w-0">
            <p className="font-semibold text-[#101114] truncate">
              {partnerDisplayName(row.first_name, row.last_name, row.email)}
            </p>
            <p className="text-xs text-[#9497a9] truncate">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'whatsapp',
        header: 'WhatsApp',
        render: (row) => (
          <span className="text-[#686b82] tabular-nums">{row.whatsapp || '—'}</span>
        ),
      },
      {
        key: 'balance',
        header: 'Saldo',
        cellClassName: 'tabular-nums',
        render: (row) => (
          <span className="font-semibold text-[#026b3f]">{formatBRL(row.credits_balance)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <AdminStatusBadge variant={row.is_active ? 'active' : 'inactive'}>
            {row.is_active ? 'Ativa' : 'Inativa'}
          </AdminStatusBadge>
        ),
      },
      {
        key: 'created',
        header: 'Criada em',
        render: (row) => (
          <span className="text-xs text-[#686b82] whitespace-nowrap">
            {formatDate(row.created)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        headerClassName: 'w-12',
        cellClassName: 'text-right',
        render: (row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(row)
            }}
            className="inline-flex rounded-lg p-2 text-[#9497a9] transition hover:bg-[#FEF3F2] hover:text-[#D92D20]"
            aria-label={`Remover ${row.email}`}
          >
            <Trash2 className="size-4" />
          </button>
        ),
      },
    ]
  }, [])

  const deleteDialogDescription = deleteTarget ? (
    <>
      <p>
        A conta <strong className="text-[#101114]">{deleteTarget.email}</strong> será desativada.
        O parceiro perde acesso imediato ao ambiente de teste.
      </p>
      <p className="mt-3">
        Saldo atual: <strong>{formatBRL(deleteTarget.credits_balance)}</strong>. Esta ação não pode
        ser desfeita pela interface.
      </p>
    </>
  ) : null

  return (
    <AdminStaffGate>
      <AdminPageShell
        title="Contas parceiros"
        description="Provisione contas de teste com créditos para parceiros. Gerencie saldo, histórico e acesso operacional."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="!w-auto gap-2 px-5"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              {listQuery.isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Atualizar
            </Button>
            <Button
              type="button"
              className="!w-auto gap-2 px-5"
              onClick={() => {
                setMode('create')
                setSelectedId(null)
                setFeedback(null)
              }}
            >
              <UserPlus className="size-4" />
              Nova conta
            </Button>
          </>
        }
      >
        {feedback && (
          <Alert
            variant={feedback.kind === 'success' ? 'success' : 'error'}
            icon={
              feedback.kind === 'success' ? (
                <CheckCircle2 className="size-5 shrink-0" />
              ) : (
                <AlertTriangle className="size-5 shrink-0" />
              )
            }
            message={feedback.message}
          />
        )}

        {listQuery.isError && (
          <Alert
            variant="warning"
            icon={<AlertTriangle className="size-5 shrink-0" />}
            message={(listQuery.error as Error)?.message ?? 'Não foi possível carregar as contas.'}
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#101114]">
                <Users className="size-5 text-[#7132f5]" />
                Registros ({listQuery.data?.count ?? '…'})
              </p>
              <div className="relative max-w-md flex-1 sm:min-w-[280px]">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9497a9]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar e-mail, nome ou WhatsApp"
                  className="w-full rounded-xl border border-[#dedee5] bg-white py-2.5 pl-10 pr-3 text-sm text-[#101114] outline-none focus:border-[#7132f5] focus:ring-2 focus:ring-[rgba(133,91,251,0.2)]"
                />
              </div>
            </div>

            <AdminDataTable
              columns={columns}
              rows={listQuery.data?.results ?? []}
              rowKey={(row) => row.id}
              activeRowKey={selectedId}
              loading={listQuery.isLoading}
              onRowClick={(row) => {
                setSelectedId(row.id)
                setMode('view')
                setFeedback(null)
              }}
              empty={
                <AdminEmptyState
                  title="Nenhuma conta encontrada"
                  description={
                    searchDebounced
                      ? 'Ajuste a busca ou limpe o filtro.'
                      : 'Provisione a primeira conta de parceiro.'
                  }
                  icon={<Users className="size-8 opacity-40" />}
                  className="border-0 bg-transparent"
                />
              }
            />

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="!w-auto px-6"
                disabled={page <= 1 || listQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-[#686b82]">Página {page}</span>
              <Button
                type="button"
                variant="outline"
                className="!w-auto px-6"
                disabled={!listQuery.data?.next || listQuery.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <div className={`${ADMIN_CARD} overflow-hidden`}>
              <div className="flex items-center justify-between gap-2 border-b border-[#dedee5] bg-[rgba(148,151,169,0.06)] px-4 py-3">
                <span className="text-sm font-semibold text-[#101114]">
                  {mode === 'create' ? 'Nova conta' : 'Detalhe operacional'}
                </span>
                {mode !== 'idle' && (
                  <button
                    type="button"
                    className="rounded-lg p-1 text-[#686b82] hover:bg-white/80"
                    aria-label="Fechar painel"
                    onClick={() => {
                      setMode('idle')
                      setSelectedId(null)
                    }}
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {mode === 'create' ? (
                <PartnerCreateForm
                  onSuccess={(account, sentInvite) => {
                    setFeedback({
                      kind: 'success',
                      message: sentInvite
                        ? `Conta provisionada para ${account.email} e convite enviado.`
                        : `Conta provisionada para ${account.email}.`,
                    })
                    setSelectedId(account.id)
                    setMode('view')
                    void refreshList()
                  }}
                  onError={(message) => setFeedback({ kind: 'error', message })}
                />
              ) : mode === 'view' && selectedId ? (
                detailQuery.isLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-6 w-2/3 rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                ) : detailQuery.data ? (
                  <PartnerDetailPanel
                    account={detailQuery.data}
                    onTopUpSuccess={() => {
                      setFeedback({ kind: 'success', message: 'Créditos adicionados.' })
                      void refreshList()
                    }}
                    onError={(message) => setFeedback({ kind: 'error', message })}
                    onRequestRemove={() => {
                      const row = listQuery.data?.results?.find((r) => r.id === selectedId)
                      if (row) setDeleteTarget(row)
                      else if (detailQuery.data) {
                        setDeleteTarget({
                          id: detailQuery.data.id,
                          email: detailQuery.data.email,
                          first_name: detailQuery.data.first_name,
                          last_name: detailQuery.data.last_name,
                          whatsapp: detailQuery.data.whatsapp,
                          credits_balance: detailQuery.data.credits_balance,
                          is_active: detailQuery.data.is_active,
                          is_partner_test: detailQuery.data.is_partner_test,
                          created: detailQuery.data.created,
                          last_grant_at: detailQuery.data.last_grant_at,
                        })
                      }
                    }}
                  />
                ) : (
                  <p className="p-4 text-sm text-[#686b82]">Detalhe indisponível.</p>
                )
              ) : (
                <p className="p-4 text-sm leading-relaxed text-[#686b82]">
                  Selecione um registro na tabela ou use <strong>Nova conta</strong> para
                  provisionar um parceiro.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#dedee5] bg-[rgba(133,91,251,0.06)] p-4 text-sm text-[#484b5e]">
              <p className="mb-2 font-semibold text-[#5741d8]">Operação</p>
              <ol className="list-inside list-decimal space-y-1 text-xs leading-relaxed">
                <li>Crie a conta com e-mail e saldo inicial.</li>
                <li>O parceiro acessa com login normal e usa créditos nas consultas.</li>
                <li>Recargas e histórico ficam no painel lateral.</li>
                <li>Remoção desativa o acesso — confirme antes de executar.</li>
              </ol>
            </div>
          </aside>
        </div>
      </AdminPageShell>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remover conta de parceiro?"
        description={deleteDialogDescription}
        confirmLabel={deleteMutation.isPending ? 'Removendo…' : 'Remover conta'}
        variant="danger"
        loading={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </AdminStaffGate>
  )
}
