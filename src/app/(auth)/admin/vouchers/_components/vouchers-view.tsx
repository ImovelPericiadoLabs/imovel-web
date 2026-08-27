'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Ticket } from 'lucide-react'

import Alert from '@/components/alert'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import {
  ADMIN_CARD,
  ADMIN_INPUT,
  AdminDataTable,
  AdminEmptyState,
  AdminPageShell,
  AdminStaffGate,
  AdminStatusBadge,
  AdminToolbar,
  type AdminTableColumn,
} from '@/components/admin'
import {
  createBatch,
  generateVouchers,
  listBatches,
  type CreateBatchPayload,
  type VoucherBatch,
} from '@/services/staff/vouchers'
import BatchCreateForm from './batch-create-form'
import BatchDetailPanel from './batch-detail-panel'
import { BATCH_STATUS_LABEL, batchStatusVariant, formatBRL, formatDate } from './voucher-utils'

type Mode = 'list' | 'create' | 'detail'

export default function VouchersView() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode>('list')
  const [selected, setSelected] = useState<VoucherBatch | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const listQuery = useQuery({
    queryKey: ['voucher-batches', statusFilter],
    queryFn: () => listBatches(1, { status: statusFilter }),
    staleTime: 20_000,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: CreateBatchPayload & { quantity: number }) => {
      const { quantity, ...batchPayload } = payload
      const batch = await createBatch(batchPayload)
      // Criar e emitir em duas chamadas é intencional: o lote existe mesmo que a
      // emissão falhe, e a emissão pode ser repetida sem recriar o lote.
      await generateVouchers(batch.id, quantity)
      return batch
    },
    onSuccess: (batch) => {
      queryClient.invalidateQueries({ queryKey: ['voucher-batches'] })
      setMode('list')
      setFeedback({
        kind: 'success',
        message:
          `Lote "${batch.name}" criado em RASCUNHO com os vouchers emitidos. ` +
          'Ative o lote quando o evento começar — em rascunho nenhum código resgata.',
      })
    },
    onError: (error: Error) => setFeedback({ kind: 'error', message: error.message }),
  })

  // O erro fácil de operação é imprimir o lote e esquecer de ativar no dia.
  const draftCount = (listQuery.data?.results ?? []).filter((b) => b.status === 'DRAFT').length

  const columns: AdminTableColumn<VoucherBatch>[] = [
    {
      key: 'name',
      header: 'Lote',
      render: (row) => (
        <div>
          <p className="font-semibold text-[#101114]">{row.name}</p>
          <p className="text-xs text-[#686b82]">{row.event_name}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <AdminStatusBadge variant={batchStatusVariant(row.status)}>
          {BATCH_STATUS_LABEL[row.status]}
        </AdminStatusBadge>
      ),
    },
    {
      key: 'benefits',
      header: 'Benefício',
      render: (row) => <span className="text-xs">{row.benefits_display}</span>,
    },
    { key: 'amount', header: 'Referência', render: (row) => formatBRL(row.credit_amount) },
    {
      key: 'counts',
      header: 'Emitidos / Resgatados',
      render: (row) => (
        <span className="tabular-nums">
          {row.issued} / <b>{row.redeemed}</b>
        </span>
      ),
    },
    {
      key: 'window',
      header: 'Validade',
      render: (row) => (
        <span className="text-xs">
          {formatDate(row.valid_from)} — {formatDate(row.valid_until)}
        </span>
      ),
    },
    {
      key: 'committed',
      header: 'Comprometido',
      render: (row) => formatBRL((row.issued - row.redeemed - row.canceled - row.expired) * Number(row.credit_amount)),
    },
  ]

  return (
    <AdminStaffGate>
      <AdminPageShell
        title="Vouchers de evento"
        description="Lotes de vouchers impressos para eventos presenciais, com validade própria e uso restrito a um tipo de consulta."
        actions={
          mode === 'list' ? (
            <Button
              onClick={() => { setMode('create'); setFeedback(null) }}
              className="w-auto px-5"
            >
              <Plus className="mr-2 size-4" />
              Novo lote
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => { setMode('list'); setSelected(null) }}
              className="w-auto px-5"
            >
              Voltar
            </Button>
          )
        }
      >
        {feedback && (
          <Alert
            variant={feedback.kind === 'error' ? 'error' : 'success'}
            message={feedback.message}
            className="mb-4"
          />
        )}

        {/* Largura limitada: formulário de 6 campos esticado numa tela larga fica
            ilegível e as colunas do grid ficam absurdamente longas. */}
        {mode === 'create' && (
          <div className={`${ADMIN_CARD} max-w-4xl`}>
            <BatchCreateForm
              onSubmit={(payload) => createMutation.mutate(payload)}
              onCancel={() => setMode('list')}
              isPending={createMutation.isPending}
              error={createMutation.error?.message}
            />
          </div>
        )}

        {mode === 'detail' && selected && <BatchDetailPanel batch={selected} />}

        {mode === 'list' && draftCount > 0 && (
          <Alert
            variant="warning"
            className="mb-4"
            message={
              `${draftCount} lote(s) em rascunho. Voucher impresso de lote em rascunho ` +
              'NÃO resgata: abra o lote e clique em "Ativar lote" quando o evento começar.'
            }
          />
        )}

        {mode === 'list' && (
          <div className={`${ADMIN_CARD} p-4`}>
            <AdminToolbar
              trailing={
                <select
                  className={ADMIN_INPUT}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(BATCH_STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              }
            />

            {listQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <AdminDataTable
                columns={columns}
                rows={listQuery.data?.results ?? []}
                rowKey={(row) => row.id}
                onRowClick={(row) => { setSelected(row); setMode('detail') }}
                empty={
                  <AdminEmptyState
                    icon={<Ticket className="size-6" />}
                    title="Nenhum lote de voucher"
                    description="Crie um lote para gerar os vouchers de um evento presencial."
                    action={
                      <Button onClick={() => setMode('create')} className="w-auto px-5">
                        Novo lote
                      </Button>
                    }
                  />
                }
              />
            )}
          </div>
        )}
      </AdminPageShell>
    </AdminStaffGate>
  )
}
