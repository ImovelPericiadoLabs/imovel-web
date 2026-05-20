'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileUp,
  Loader2,
  RefreshCw,
  Send,
  User,
  X,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import {
  AdminEmptyState,
  AdminKpiStrip,
  AdminPageShell,
  AdminPanelHeader,
  AdminStaffGate,
  ADMIN_INBOX_ITEM,
  ADMIN_INBOX_ITEM_ACTIVE,
  ADMIN_PANEL,
} from '@/components/admin'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'
import {
  enqueueManualReviewAnalysis,
  getManualReviewOrder,
  listManualReviewOrders,
  resolveManualReview,
  uploadManualReviewRegistration,
  type StaffManualReviewOrderDetail,
  type StaffManualReviewOrderListItem,
} from '@/services/staff/manual-review'

function hoursRemaining(deadlineIso: string | null): number | null {
  if (!deadlineIso) return null
  const end = new Date(deadlineIso).getTime()
  if (Number.isNaN(end)) return null
  return Math.max(0, (end - Date.now()) / 3600000)
}

function formatHours(h: number | null): string {
  if (h === null) return '—'
  if (h <= 0) return 'Prazo encerrado'
  const hh = Math.floor(h)
  const mm = Math.floor((h - hh) * 60)
  return `${hh}h ${mm}m`
}

export default function ManualReviewAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<'invalid_data' | 'registration_not_found' | 'other'>('other')
  const [rejectNotes, setRejectNotes] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const canAccess = Boolean(me?.is_staff || me?.is_superuser)

  const listQuery = useQuery({
    queryKey: ['staff-manual-review', page],
    queryFn: () => listManualReviewOrders(page),
    enabled: canAccess,
  })

  const detailQuery = useQuery({
    queryKey: ['staff-manual-review-detail', selectedId],
    queryFn: () => getManualReviewOrder(selectedId as string),
    enabled: Boolean(canAccess && selectedId),
  })

  useEffect(() => {
    if (!listQuery.data?.results?.length) return
    if (selectedId && listQuery.data.results.some((r) => r.id === selectedId)) return
    setSelectedId(listQuery.data.results[0]?.id ?? null)
  }, [listQuery.data, selectedId])

  const uploadMutation = useMutation({
    mutationFn: ({ orderId, file }: { orderId: string; file: File }) =>
      uploadManualReviewRegistration(orderId, file),
    onSuccess: async (_, vars) => {
      setUploadError(null)
      await queryClient.invalidateQueries({ queryKey: ['staff-manual-review-detail', vars.orderId] })
      await queryClient.invalidateQueries({ queryKey: ['staff-manual-review'] })
    },
    onError: (e: unknown) => {
      setUploadError(e instanceof Error ? e.message : 'Falha no envio do arquivo.')
    },
  })

  const enqueueMutation = useMutation({
    mutationFn: (orderId: string) => enqueueManualReviewAnalysis(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff-manual-review'] })
      setSelectedId(null)
    },
  })

  const resolveMutation = useMutation({
    mutationFn: (payload: {
      orderId: string
      action: 'enqueue_analysis' | 'reject'
      reason_code?: 'invalid_data' | 'registration_not_found' | 'other'
      notes?: string
    }) =>
      resolveManualReview(payload.orderId, {
        action: payload.action,
        reason_code: payload.reason_code,
        notes: payload.notes,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff-manual-review'] })
      await queryClient.invalidateQueries({ queryKey: ['staff-manual-review-detail'] })
      setSelectedId(null)
    },
  })

  const selectedSummary = useMemo(
    () => listQuery.data?.results?.find((r) => r.id === selectedId),
    [listQuery.data, selectedId],
  )

  const onPickFile = useCallback(
    (orderId: string, files: FileList | null) => {
      const f = files?.[0]
      if (!f) return
      setUploadError(null)
      uploadMutation.mutate({ orderId, file: f })
    },
    [uploadMutation],
  )

  const queue = listQuery.data?.results ?? []
  const urgent = queue.filter((r) => {
    const h = hoursRemaining(r.manual_review_deadline)
    return h !== null && h <= 4
  }).length

  return (
    <AdminStaffGate>
      <AdminPageShell
        metrics={
          <AdminKpiStrip
            items={[
              {
                id: 'queue',
                label: 'Na fila',
                value: listQuery.data?.count ?? '—',
                icon: ClipboardList,
                tone: 'brand',
              },
              {
                id: 'urgent',
                label: 'SLA crítico',
                value: urgent,
                tone: urgent > 0 ? 'warning' : 'default',
              },
              { id: 'page', label: 'Página', value: page },
            ]}
          />
        }
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 !w-auto rounded-lg px-4 text-xs"
            onClick={() => listQuery.refetch()}
            disabled={!canAccess || listQuery.isFetching}
          >
            {listQuery.isFetching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Atualizar
          </Button>
        }
      >

      {listQuery.isError && (
        <Alert
          variant="warning"
          icon={<AlertTriangle className="size-5 shrink-0" />}
          message={(listQuery.error as Error)?.message ?? 'Não foi possível carregar a fila.'}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <section className={cn(ADMIN_PANEL, 'flex flex-col overflow-hidden')}>
          <AdminPanelHeader title="Fila manual" meta={`${listQuery.data?.count ?? '…'} pedidos`} />

          {listQuery.isLoading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <ul className="max-h-[min(32rem,65vh)] flex-1 space-y-1 overflow-y-auto p-2">
              {queue.map((row) => {
                const h = hoursRemaining(row.manual_review_deadline)
                const urgentRow = h !== null && h <= 4
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        ADMIN_INBOX_ITEM,
                        'flex-col items-stretch gap-1',
                        selectedId === row.id
                          ? ADMIN_INBOX_ITEM_ACTIVE
                          : 'hover:bg-[rgba(133,91,251,0.05)]',
                      )}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#101114]">#{row.code}</p>
                        <span
                          className={cn(
                            'shrink-0 text-[10px] font-semibold tabular-nums',
                            urgentRow ? 'text-amber-900' : 'text-[#9497a9]',
                          )}
                        >
                          {formatHours(h)}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-[11px] text-[#686b82]">
                        {row.formatted_address ?? 'Sem endereço'}
                      </p>
                      {row.registration_number ? (
                        <span className="mt-0.5 inline-block rounded bg-[rgba(20,158,97,0.16)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#026b3f]">
                          Matrícula
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
              {!queue.length && !listQuery.isLoading && (
                <AdminEmptyState
                  title="Fila vazia"
                  description="Novos pedidos aparecem aqui automaticamente."
                  className="m-2 border-0"
                />
              )}
            </ul>
          )}

          <div className="flex justify-center gap-2 border-t border-[#dedee5] p-2">
            <Button
              type="button"
              variant="outline"
              className="!w-auto px-6"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1))
                setSelectedId(null)
              }}
            >
              Anterior
            </Button>
            <span className="flex items-center text-sm text-[#686b82]">Página {page}</span>
            <Button
              type="button"
              variant="outline"
              className="!w-auto px-6"
              disabled={!listQuery.data?.next || listQuery.isFetching}
              onClick={() => {
                setPage((p) => p + 1)
                setSelectedId(null)
              }}
            >
              Seguinte
            </Button>
          </div>
        </section>

        <aside className={cn(ADMIN_PANEL, 'lg:sticky lg:top-2 h-fit overflow-hidden')}>
            <AdminPanelHeader
              title="Resolução"
              meta={selectedSummary ? `#${selectedSummary.code}` : undefined}
              actions={
                selectedId ? (
                  <button
                    type="button"
                    className="rounded-lg p-1 text-[#686b82] hover:bg-[rgba(148,151,169,0.08)]"
                    aria-label="Fechar seleção"
                    onClick={() => setSelectedId(null)}
                  >
                    <X className="size-4" />
                  </button>
                ) : undefined
              }
            />

            {!selectedId || !selectedSummary ? (
              <AdminEmptyState
                title="Selecione um pedido"
                className="m-3 border-0 bg-transparent py-8"
              />
            ) : detailQuery.isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : detailQuery.data ? (
              <ManualReviewDetailPanel
                order={detailQuery.data}
                hoursLeft={hoursRemaining(detailQuery.data.manual_review_deadline)}
                uploadError={uploadError}
                onUpload={(files) => onPickFile(detailQuery.data.id, files)}
                uploading={uploadMutation.isPending}
                onEnqueue={() => enqueueMutation.mutate(detailQuery.data.id)}
                enqueuePending={enqueueMutation.isPending}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                rejectNotes={rejectNotes}
                setRejectNotes={setRejectNotes}
                onReject={() =>
                  resolveMutation.mutate({
                    orderId: detailQuery.data.id,
                    action: 'reject',
                    reason_code: rejectReason,
                    notes: rejectNotes,
                  })
                }
                resolvePending={resolveMutation.isPending}
              />
            ) : (
              <p className="p-4 text-xs text-[#686b82]">Detalhe indisponível.</p>
            )}
        </aside>
      </div>
      </AdminPageShell>
    </AdminStaffGate>
  )
}

function ManualReviewDetailPanel({
  order,
  hoursLeft,
  uploadError,
  onUpload,
  uploading,
  onEnqueue,
  enqueuePending,
  rejectReason,
  setRejectReason,
  rejectNotes,
  setRejectNotes,
  onReject,
  resolvePending,
}: {
  order: StaffManualReviewOrderDetail
  hoursLeft: number | null
  uploadError: string | null
  onUpload: (files: FileList | null) => void
  uploading: boolean
  onEnqueue: () => void
  enqueuePending: boolean
  rejectReason: 'invalid_data' | 'registration_not_found' | 'other'
  setRejectReason: (v: 'invalid_data' | 'registration_not_found' | 'other') => void
  rejectNotes: string
  setRejectNotes: (v: string) => void
  onReject: () => void
  resolvePending: boolean
}) {
  const msgs = order.manual_review?.validation_messages ?? []
  const doc = order.document_response as { staff_registration_uploaded_at?: string } | null

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-3 justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#9497a9]">Consulta</p>
          <p className="text-xl font-bold text-[#101114]">#{order.code}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#dedee5] px-3 py-2">
          <Clock className="size-4 text-[#7132f5]" />
          <span className="text-sm font-medium text-[#101114]">{formatHours(hoursLeft)}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-[#484b5e]">
        <User className="size-4 mt-0.5 shrink-0 text-[#7132f5]" />
        <div>
          <p>{order.customer_email ?? '—'}</p>
          <p className="text-xs text-[#9497a9]">{order.customer_whatsapp || 'WhatsApp não informado'}</p>
        </div>
      </div>

      {msgs.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" /> Motivo automático (validação)
          </p>
          <ul className="mt-2 list-disc list-inside space-y-0.5">
            {msgs.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#101114] mb-2">Anexar matrícula (PDF)</label>
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#5741d8]/40 bg-white px-4 py-6 cursor-pointer hover:bg-[rgba(133,91,251,0.04)] transition">
          <FileUp className="size-8 text-[#7132f5]" />
          <span className="text-sm text-[#686b82] text-center">
            Clique para enviar ou solte o arquivo aqui
          </span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
        {uploading && (
          <p className="text-xs text-[#5741d8] mt-2 flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" /> Enviando…
          </p>
        )}
        {uploadError && (
          <p className="text-xs text-red-600 mt-2">{uploadError}</p>
        )}
        {doc?.staff_registration_uploaded_at && (
          <p className="text-xs text-[#026b3f] mt-2 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Upload registrado neste pedido.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full justify-center gap-2 bg-[#7132f5] hover:bg-[#5741d8] text-white border-0 rounded-xl py-3"
          onClick={onEnqueue}
          disabled={enqueuePending}
        >
          {enqueuePending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Enviar para análise
        </Button>
        <p className="text-xs text-[#9497a9] text-center">Exige PDF de matrícula anexado ao pedido.</p>
      </div>

      <div className="border-t border-[#dedee5] pt-4 space-y-3">
        <p className="text-sm font-semibold text-[#101114]">Encerrar sem sucesso</p>
        <select
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value as typeof rejectReason)}
          className="w-full rounded-xl border border-[#dedee5] px-3 py-2.5 text-sm text-[#101114] bg-white"
        >
          <option value="invalid_data">Dados incorretos / insuficientes</option>
          <option value="registration_not_found">Matrícula não existe / não localizada</option>
          <option value="other">Outro (detalhar)</option>
        </select>
        <textarea
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          placeholder="Notas internas ou mensagem ao cliente (se «Outro»)"
          rows={3}
          className="w-full rounded-xl border border-[#dedee5] px-3 py-2.5 text-sm text-[#101114] outline-none focus:border-[#7132f5]"
        />
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
          onClick={onReject}
          disabled={resolvePending}
        >
          {resolvePending ? <Loader2 className="size-4 animate-spin" /> : null}
          Rejeitar pedido (notificar cliente)
        </Button>
      </div>
    </div>
  )
}
