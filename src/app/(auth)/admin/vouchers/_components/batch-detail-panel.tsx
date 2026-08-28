'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, FileDown, Loader2, Pause, Pencil, Play, RefreshCw, Search, Trash2 } from 'lucide-react'

import Alert from '@/components/alert'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import {
  ADMIN_CARD,
  ADMIN_INPUT,
  AdminDataTable,
  AdminEmptyState,
  AdminKpiStrip,
  AdminPanelHeader,
  AdminStatusBadge,
  type AdminTableColumn,
} from '@/components/admin'
import {
  cancelVoucher,
  deleteBatch,
  downloadBatchPdf,
  fetchBatchPdfBlob,
  getBatchPdfStatus,
  expireBatch,
  getBatchReport,
  listVouchers,
  reissueVoucher,
  updateBatch,
  type CreateBatchPayload,
  type Voucher,
  type VoucherBatch,
} from '@/services/staff/vouchers'
import { printProofHint, type BatchPdfPrintConfig, type BatchPdfStatus } from '@/services/staff/voucher-print'
import {
  BATCH_STATUS_LABEL,
  VOUCHER_STATUS_LABEL,
  batchStatusVariant,
  formatBRL,
  formatDate,
  formatDateTime,
  triggerDownload,
  voucherStatusVariant,
} from './voucher-utils'
import BatchCreateForm from './batch-create-form'
import PrintPdfDialog from './print-pdf-dialog'

export default function BatchDetailPanel({
  batch,
  onDeleted,
  onUpdated,
}: {
  batch: VoucherBatch
  onDeleted?: () => void
  onUpdated?: (batch: VoucherBatch) => void
}) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [editing, setEditing] = useState(false)
  const [printDialog, setPrintDialog] = useState<null | { force: boolean }>(null)
  const [printConfig, setPrintConfig] = useState<BatchPdfPrintConfig | null>(null)

  const reportQuery = useQuery({
    queryKey: ['voucher-batch-report', batch.id],
    queryFn: () => getBatchReport(batch.id),
    staleTime: 15_000,
  })

  const vouchersQuery = useQuery({
    queryKey: ['voucher-batch-vouchers', batch.id, page, statusFilter, search],
    queryFn: () => listVouchers(batch.id, page, { status: statusFilter, search }),
    staleTime: 15_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['voucher-batch-report', batch.id] })
    queryClient.invalidateQueries({ queryKey: ['voucher-batch-vouchers', batch.id] })
    queryClient.invalidateQueries({ queryKey: ['voucher-batches'] })
  }

  const pdfStatusQuery = useQuery({
    queryKey: ['voucher-batch-pdf', batch.id, printConfig],
    queryFn: () => getBatchPdfStatus(batch.id, printConfig as BatchPdfPrintConfig),
    enabled: printDialog !== null && printConfig !== null,
    staleTime: 5_000,
    refetchInterval: printDialog !== null ? 8_000 : false,
  })

  const rememberPrintConfig = useCallback((config: BatchPdfPrintConfig) => {
    setPrintConfig(config)
  }, [])

  const pdfMutation = useMutation({
    mutationFn: async ({ config, force }: { config: BatchPdfPrintConfig; force: boolean }) => {
      const state = await downloadBatchPdf(batch.id, config, { force })
      try {
        const blob = await fetchBatchPdfBlob(batch.id, config, { fresh: force })
        return { state, blob }
      } catch {
        return { state, blob: null }
      }
    },
    onSuccess: ({ state, blob }, { config, force }) => {
      if (blob) {
        triggerDownload(blob, `vouchers-${batch.event_name}-${batch.name}.pdf`)
      } else {
        const url = state.pdf_url || state.last_pdf_url
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }
      setPrintDialog(null)
      const url = state.pdf_url || state.last_pdf_url
      setFeedback({
        kind: 'success',
        message: url
          ? `${force ? 'PDF regerado.' : printProofHint(config)} Link: ${url}`
          : force
            ? 'PDF regerado do zero com os dados atuais da campanha.'
            : printProofHint(config),
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const editMutation = useMutation({
    mutationFn: (payload: CreateBatchPayload & { quantity: number }) =>
      updateBatch(batch.id, {
        name: payload.name,
        event_name: payload.event_name,
        credit_amount: payload.credit_amount,
        benefits: payload.benefits,
        max_vouchers: payload.max_vouchers,
        valid_from: payload.valid_from,
        valid_until: payload.valid_until,
      }),
    onSuccess: (updated) => {
      invalidate()
      onUpdated?.(updated)
      setEditing(false)
      setFeedback({
        kind: 'success',
        message:
          'Dados da campanha atualizados. O próximo "PDF para impressão" já sai com eles — ' +
          'não precisa regerar manualmente.',
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'PAUSED') => updateBatch(batch.id, { status }),
    onSuccess: (updated) => {
      invalidate()
      setFeedback({
        kind: 'success',
        message:
          updated.status === 'ACTIVE'
            ? 'Lote ATIVO. Os códigos impressos já resgatam dentro da janela de validade.'
            : 'Lote pausado. Nenhum resgate novo até reativar.',
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteBatch(batch.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['voucher-batches'] })
      onDeleted?.()
      setFeedback({
        kind: 'success',
        message: `Lote "${result.batch}" excluído com ${result.vouchers} voucher(s).`,
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const expireMutation = useMutation({
    mutationFn: () => expireBatch(batch.id),
    onSuccess: () => {
      invalidate()
      setFeedback({ kind: 'success', message: 'Lote expirado. Nenhum resgate novo será aceito.' })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelVoucher(id, 'Cancelado pelo painel'),
    onSuccess: () => {
      invalidate()
      setFeedback({ kind: 'success', message: 'Voucher cancelado.' })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const reissueMutation = useMutation({
    mutationFn: (id: string) => reissueVoucher(id, 'Reemitido pelo painel'),
    onSuccess: (novo) => {
      invalidate()
      setFeedback({
        kind: 'success',
        message: `Voucher reemitido: ${novo.formatted_code}. O original foi cancelado.`,
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  const report = reportQuery.data
  const columns: AdminTableColumn<Voucher>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (row) => <code className="font-mono text-xs">{row.formatted_code}</code>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <AdminStatusBadge variant={voucherStatusVariant(row.status)}>
          {VOUCHER_STATUS_LABEL[row.status]}
        </AdminStatusBadge>
      ),
    },
    { key: 'by', header: 'Resgatado por', render: (row) => row.redeemed_by_email || '—' },
    { key: 'at', header: 'Resgatado em', render: (row) => formatDateTime(row.redeemed_at) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'REDEEMED' ? null : (
          <div className="flex gap-1">
            <Button
              variant="outline" className="w-auto px-2.5 py-1.5"
              onClick={() => cancelMutation.mutate(row.id)}
              disabled={row.status === 'CANCELED' || cancelMutation.isPending}
              title="Cancelar voucher"
            >
              <Ban className="size-3.5" />
            </Button>
            <Button
              variant="outline" className="w-auto px-2.5 py-1.5"
              onClick={() => reissueMutation.mutate(row.id)}
              disabled={reissueMutation.isPending}
              title="Reemitir (cancela este e cria um substituto)"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <AdminPanelHeader
        title={`${batch.event_name} — ${batch.name}`}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#686b82]">
            <AdminStatusBadge variant={batchStatusVariant(batch.status)}>
              {BATCH_STATUS_LABEL[batch.status]}
            </AdminStatusBadge>
            <span>{batch.benefits_display}</span>
            <span>·</span>
            <span>{formatDate(batch.valid_from)} a {formatDate(batch.valid_until)}</span>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {batch.status !== 'ACTIVE' && batch.status !== 'EXPIRED' && (
              <Button
                onClick={() => statusMutation.mutate('ACTIVE')}
                disabled={statusMutation.isPending}
                className="w-auto px-5"
              >
                <Play className="mr-2 size-4" />
                Ativar lote
              </Button>
            )}
            {batch.status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={() => statusMutation.mutate('PAUSED')}
                disabled={statusMutation.isPending}
                className="w-auto px-5"
              >
                <Pause className="mr-2 size-4" />
                Pausar
              </Button>
            )}
            <Button
              onClick={() => { setPrintDialog({ force: false }); setFeedback(null) }}
              disabled={pdfMutation.isPending}
              className="w-auto px-5"
            >
              {pdfMutation.isPending && !printDialog?.force
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : <FileDown className="mr-2 size-4" />}
              PDF para impressão
            </Button>
            <Button
              variant="outline"
              onClick={() => { setPrintDialog({ force: true }); setFeedback(null) }}
              disabled={pdfMutation.isPending}
              className="w-auto px-5"
              title="Descarta o PDF já gerado e renderiza de novo com os dados atuais"
            >
              {pdfMutation.isPending && printDialog?.force
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : <RefreshCw className="mr-2 size-4" />}
              Regerar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => { setEditing((prev) => !prev); setFeedback(null) }}
              className="w-auto px-5"
            >
              <Pencil className="mr-2 size-4" />
              {editing ? 'Fechar edição' : 'Editar campanha'}
            </Button>
            {batch.redeemed === 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      `Excluir o lote "${batch.name}" e seus ${batch.issued} voucher(s)? ` +
                      'Esta ação não pode ser desfeita.',
                    )
                  ) {
                    deleteMutation.mutate()
                  }
                }}
                disabled={deleteMutation.isPending}
                className="w-auto px-5"
                title="Só é possível enquanto nenhum voucher foi resgatado"
              >
                <Trash2 className="mr-2 size-4" />
                Excluir lote
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => expireMutation.mutate()}
              disabled={batch.status === 'EXPIRED' || expireMutation.isPending}
              className="w-auto px-5"
            >
              Encerrar evento
            </Button>
          </div>
        }
      />

      {feedback && (
        <Alert
          variant={feedback.kind === 'error' ? 'error' : 'success'}
          message={feedback.message}
        />
      )}

      <PrintPdfDialog
        open={printDialog !== null}
        forceDefault={printDialog?.force ?? false}
        loading={pdfMutation.isPending}
        lastPdf={pdfStatusQuery.data ?? null}
        onConfigChange={rememberPrintConfig}
        onClose={() => { if (!pdfMutation.isPending) setPrintDialog(null) }}
        onConfirm={(config, force) => pdfMutation.mutate({ config, force })}
      />

      {editing && (
        <div className={ADMIN_CARD}>
          <BatchCreateForm
            key={batch.id}
            initial={batch}
            onSubmit={(payload) => editMutation.mutate(payload)}
            onCancel={() => setEditing(false)}
            isPending={editMutation.isPending}
          />
        </div>
      )}

      {reportQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : report ? (
        <AdminKpiStrip
          items={[
            { id: 'issued', label: 'Emitidos', value: report.issued },
            {
              id: 'redeemed', label: 'Resgatados', tone: 'brand',
              value: report.redeemed,
              hint: `${(report.conversion_rate * 100).toFixed(1)}% de conversão`,
            },
            {
              id: 'outstanding', label: 'Em aberto', tone: 'warning',
              value: report.outstanding,
              hint: `${formatBRL(report.outstanding_value)} de exposição`,
            },
            {
              id: 'value', label: 'Já utilizado', tone: 'success',
              value: formatBRL(report.redeemed_value),
              hint: `${report.canceled} cancelados · ${report.expired} expirados`,
            },
          ]}
        />
      ) : null}

      <div className={`${ADMIN_CARD} p-4`}>
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9497a9]" />
            <input
              className={`${ADMIN_INPUT} pl-9`}
              placeholder="Buscar por código"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className={ADMIN_INPUT}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">Todos os status</option>
            {Object.entries(VOUCHER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {vouchersQuery.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <AdminDataTable
            columns={columns}
            rows={vouchersQuery.data?.results ?? []}
            rowKey={(row) => row.id}
            empty={
              <AdminEmptyState
                title="Nenhum voucher"
                description="Gere os vouchers do lote para poder imprimir."
              />
            }
          />
        )}

        {(vouchersQuery.data?.count ?? 0) > 25 && (
          <div className="mt-3 flex items-center justify-between text-xs text-[#686b82]">
            <span>{vouchersQuery.data?.count} vouchers</span>
            <div className="flex gap-2">
              <Button variant="outline" className="w-auto px-3 py-1.5 text-xs" disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" className="w-auto px-3 py-1.5 text-xs" disabled={!vouchersQuery.data?.next}
                      onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
