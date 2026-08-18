'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import Alert from '@/components/alert'
import Button from '@/components/button'
import Skeleton from '@/components/skeleton'
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminKpiStrip,
  AdminPageShell,
  AdminPanelHeader,
  AdminStaffGate,
  AdminStatusBadge,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
} from '@/components/admin'
import { cn } from '@/utils/tailwind'
import {
  createRelayHubConnection,
  deleteRelayHubConnection,
  getRelayHubMeta,
  getRelayHubQr,
  listRelayHubConnections,
  relayHubConnectionAction,
  RELAYHUB_STATUS_LABELS,
  type RelayHubConnection,
  type RelayHubConnectionStatus,
} from '@/services/messaging'

function formatWhen(value: string | null | undefined) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function statusVariant(
  status: RelayHubConnectionStatus,
): 'active' | 'inactive' | 'neutral' | 'warning' | 'brand' {
  if (status === 'connected') return 'active'
  if (status === 'pending') return 'warning'
  if (status === 'error') return 'inactive'
  return 'neutral'
}

function qrSrc(qr: string) {
  if (!qr) return ''
  if (qr.startsWith('data:') || qr.startsWith('http')) return qr
  return `data:image/png;base64,${qr}`
}

const BTN_SM = '!w-auto gap-1.5 rounded-lg px-3 py-2 text-xs'

export default function RelayHubIntegrationsView() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [instanceName, setInstanceName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [environment, setEnvironment] = useState('local')
  const [onceSecret, setOnceSecret] = useState<string | null>(null)
  const [qrPayload, setQrPayload] = useState<{ qr: string; code: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RelayHubConnection | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  )

  const metaQuery = useQuery({
    queryKey: ['relayhub-meta'],
    queryFn: getRelayHubMeta,
    staleTime: 30_000,
  })

  const listQuery = useQuery({
    queryKey: ['relayhub-connections'],
    queryFn: listRelayHubConnections,
    staleTime: 15_000,
  })

  const connections = useMemo(() => listQuery.data?.results ?? [], [listQuery.data?.results])
  const selected = connections.find((c) => c.id === selectedId) ?? connections[0] ?? null
  const canManage = metaQuery.data?.can_manage ?? false
  const canTest = metaQuery.data?.can_test ?? false

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['relayhub-connections'] })
    await queryClient.invalidateQueries({ queryKey: ['relayhub-meta'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createRelayHubConnection({
        instance_name: instanceName.trim(),
        display_name: displayName.trim() || instanceName.trim(),
        webhook_url: webhookUrl.trim() || undefined,
        environment,
      }),
    onSuccess: async (conn) => {
      setOnceSecret(conn.webhook_hmac_secret_once || null)
      setCreating(false)
      setInstanceName('')
      setDisplayName('')
      setSelectedId(conn.id)
      setFeedback({ kind: 'success', message: 'Conexão criada. Guarde o segredo HMAC se exibido.' })
      await refresh()
    },
    onError: (err: unknown) => {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Falha ao criar conexão.',
      })
    },
  })

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'test' | 'activate' | 'deactivate' | 'regenerate_webhook_secret' | 'refresh_state'
    }) => relayHubConnectionAction(id, action),
    onSuccess: async (data, vars) => {
      if (vars.action === 'regenerate_webhook_secret') {
        const secret = (data as { webhook_hmac_secret_once?: string }).webhook_hmac_secret_once
        if (secret) setOnceSecret(secret)
      }
      setFeedback({ kind: 'success', message: 'Ação concluída.' })
      await refresh()
    },
    onError: (err: unknown) => {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Falha na ação.',
      })
    },
  })

  const qrMutation = useMutation({
    mutationFn: (id: string) => getRelayHubQr(id),
    onSuccess: async (data) => {
      setQrPayload({ qr: data.qr, code: data.code })
      setSelectedId(data.connection.id)
      await refresh()
    },
    onError: (err: unknown) => {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Não foi possível obter o QR.',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRelayHubConnection(id),
    onSuccess: async () => {
      setDeleteTarget(null)
      setSelectedId(null)
      setQrPayload(null)
      setFeedback({ kind: 'success', message: 'Conexão removida.' })
      await refresh()
    },
    onError: (err: unknown) => {
      setFeedback({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Falha ao remover.',
      })
    },
  })

  const kpis = useMemo(() => {
    const connected = connections.filter((c) => c.status === 'connected').length
    const errors = connections.filter((c) => c.status === 'error').length
    const health = metaQuery.data?.health as { ok?: boolean } | null | undefined
    const healthOk = health?.ok !== false && Boolean(metaQuery.data?.relayhub_configured)
    return [
      { id: 'total', label: 'Conexões', value: String(connections.length) },
      { id: 'ok', label: 'Conectadas', value: String(connected), tone: 'success' as const },
      { id: 'err', label: 'Com erro', value: String(errors), tone: errors ? ('danger' as const) : ('default' as const) },
      {
        id: 'rh',
        label: 'RelayHub',
        value: healthOk ? 'Online' : 'Verificar',
        tone: healthOk ? ('success' as const) : ('warning' as const),
      },
    ]
  }, [connections, metaQuery.data])

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setFeedback({ kind: 'success', message: `${label} copiado.` })
    } catch {
      setFeedback({ kind: 'error', message: 'Não foi possível copiar.' })
    }
  }

  return (
    <AdminStaffGate>
      <AdminPageShell
        description="Configure WhatsApp (RelayHub) pela interface — sem terminal ou Django Admin."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className={BTN_SM}
              onClick={() => refresh()}
              disabled={listQuery.isFetching}
            >
              <RefreshCw className={cn('size-3.5', listQuery.isFetching && 'animate-spin')} />
              Atualizar
            </Button>
            {canManage && (
              <Button type="button" className={BTN_SM} onClick={() => setCreating(true)}>
                <Plus className="size-3.5" />
                Nova conexão
              </Button>
            )}
          </>
        }
        metrics={<AdminKpiStrip items={kpis} />}
      >
        {feedback && (
          <Alert
            variant={feedback.kind === 'success' ? 'success' : 'error'}
            message={feedback.message}
            icon={
              feedback.kind === 'success' ? (
                <CheckCircle2 className="size-5 shrink-0" />
              ) : undefined
            }
          />
        )}

        {onceSecret && (
          <div className={cn(ADMIN_CARD, 'p-3 border-[rgba(113,50,245,0.25)] bg-[rgba(133,91,251,0.06)]')}>
            <p className={ADMIN_LABEL}>Segredo HMAC (exibido uma vez)</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="break-all text-xs text-[#101114]">{onceSecret}</code>
              <Button
                type="button"
                variant="outline"
                className={BTN_SM}
                onClick={() => copyText(onceSecret, 'Segredo')}
              >
                <Copy className="size-3.5" />
                Copiar
              </Button>
              <button
                type="button"
                className="text-xs font-medium text-[#686b82] hover:text-[#101114]"
                onClick={() => setOnceSecret(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {metaQuery.isLoading || listQuery.isLoading ? (
          <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : listQuery.isError ? (
          <AdminEmptyState
            icon={<WifiOff className="size-6 text-[#7132f5]" />}
            title="Não foi possível carregar"
            description="Verifique sua sessão e permissões de integração."
            action={
              <Button type="button" className={BTN_SM} onClick={() => listQuery.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className={cn(ADMIN_PANEL, 'flex max-h-[min(32rem,calc(100dvh-12rem))] flex-col')}>
              <AdminPanelHeader title="Conexões" meta={`${connections.length} ativas`} />
              <div className="min-h-0 flex-1 overflow-auto p-2">
                {connections.length === 0 ? (
                  <AdminEmptyState
                    icon={<Radio className="size-6 text-[#7132f5]" />}
                    title="Nenhuma conexão"
                    description="Crie a primeira integração WhatsApp via RelayHub."
                    className="py-8"
                  />
                ) : (
                  <ul className="space-y-1">
                    {connections.map((c) => {
                      const active = (selected?.id ?? '') === c.id
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(c.id)
                              setQrPayload(null)
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition',
                              active
                                ? 'bg-[rgba(113,50,245,0.12)] ring-1 ring-[rgba(113,50,245,0.25)]'
                                : 'hover:bg-[#F4F5FA]',
                            )}
                          >
                            {c.status === 'connected' ? (
                              <Wifi className="size-3.5 shrink-0 text-[#026b3f]" />
                            ) : (
                              <WifiOff className="size-3.5 shrink-0 text-[#9497a9]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#101114]">
                                {c.instance_name}
                              </p>
                              <p className="truncate text-[11px] text-[#9497a9]">{c.environment}</p>
                            </div>
                            <AdminStatusBadge variant={statusVariant(c.status)} dot>
                              {RELAYHUB_STATUS_LABELS[c.status] ?? c.status}
                            </AdminStatusBadge>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </aside>

            <section className={cn(ADMIN_PANEL, 'min-w-0')}>
              {!selected ? (
                <div className="p-6">
                  <AdminEmptyState
                    icon={<Radio className="size-6 text-[#7132f5]" />}
                    title="Selecione ou crie uma conexão"
                    description={
                      metaQuery.data?.suggested_webhook_url
                        ? `Webhook sugerido: ${metaQuery.data.suggested_webhook_url}`
                        : 'Configure PUBLIC_API_BASE_URL no ambiente para sugerir o webhook.'
                    }
                  />
                </div>
              ) : (
                <>
                  <AdminPanelHeader
                    title={selected.instance_name}
                    meta={`Conta ${selected.relayhub_account_id}`}
                    actions={
                      <AdminStatusBadge variant={statusVariant(selected.status)} dot>
                        {RELAYHUB_STATUS_LABELS[selected.status]}
                      </AdminStatusBadge>
                    }
                  />
                  <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Ambiente" value={selected.environment || '—'} />
                      <Field label="Base URL" value={selected.base_url || '—'} />
                      <Field label="Token" value={selected.token_hint || '—'} />
                      <Field label="HMAC" value={selected.hmac_hint || '—'} />
                      <Field
                        label="Webhook"
                        value={selected.webhook_url || '—'}
                        onCopy={
                          selected.webhook_url
                            ? () => copyText(selected.webhook_url, 'Webhook')
                            : undefined
                        }
                      />
                      <Field label="Último webhook" value={formatWhen(selected.last_webhook_at)} />
                      <Field label="Última saúde" value={formatWhen(selected.last_health_at)} />
                      <Field label="Último erro" value={selected.last_error || 'Nenhum'} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canTest && (
                        <Button
                          type="button"
                          variant="outline"
                          className={BTN_SM}
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({ id: selected.id, action: 'test' })
                          }
                        >
                          {actionMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          Testar
                        </Button>
                      )}
                      {canManage && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            className={BTN_SM}
                            onClick={() => qrMutation.mutate(selected.id)}
                            disabled={qrMutation.isPending}
                          >
                            <QrCode className="size-3.5" />
                            Parear WhatsApp
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={BTN_SM}
                            onClick={() =>
                              actionMutation.mutate({ id: selected.id, action: 'activate' })
                            }
                          >
                            Ativar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={BTN_SM}
                            onClick={() =>
                              actionMutation.mutate({ id: selected.id, action: 'deactivate' })
                            }
                          >
                            Desativar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={BTN_SM}
                            onClick={() =>
                              actionMutation.mutate({
                                id: selected.id,
                                action: 'regenerate_webhook_secret',
                              })
                            }
                          >
                            Regenerar HMAC
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(BTN_SM, 'border-[#D92D20] text-[#D92D20]')}
                            onClick={() => setDeleteTarget(selected)}
                          >
                            <Trash2 className="size-3.5" />
                            Excluir
                          </Button>
                        </>
                      )}
                    </div>

                    {(qrPayload || qrMutation.isPending) && (
                      <div className={cn(ADMIN_CARD, 'flex flex-col items-center gap-3 p-4 sm:flex-row')}>
                        {qrMutation.isPending ? (
                          <Loader2 className="size-8 animate-spin text-[#7132f5]" />
                        ) : qrPayload?.qr ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrSrc(qrPayload.qr)}
                            alt="QR WhatsApp"
                            className="size-44 rounded-lg border border-[#dedee5] bg-white p-2"
                          />
                        ) : (
                          <p className="text-sm text-[#686b82]">
                            QR indisponível. Tente novamente após conectar a instância.
                          </p>
                        )}
                        <div className="min-w-0 space-y-1 text-sm text-[#686b82]">
                          <p className="font-semibold text-[#101114]">Escaneie no WhatsApp</p>
                          <p>Dispositivos conectados → Conectar um dispositivo.</p>
                          <Button
                            type="button"
                            variant="outline"
                            className={BTN_SM}
                            onClick={() =>
                              actionMutation.mutate({
                                id: selected.id,
                                action: 'refresh_state',
                              })
                            }
                          >
                            Verificar conexão
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </AdminPageShell>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <div className={cn(ADMIN_PANEL, 'w-full max-w-md p-4')}>
            <h3 className="text-sm font-semibold text-[#101114]">Nova conexão RelayHub</h3>
            <p className="mt-1 text-xs text-[#9497a9]">
              Provisiona conta, instância WhatsApp e webhook automaticamente.
            </p>
            <div className="mt-3 space-y-3">
              <label className="block space-y-1">
                <span className={ADMIN_LABEL}>Nome da instância</span>
                <input
                  className={ADMIN_INPUT}
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="ex: suporte-imovel"
                />
              </label>
              <label className="block space-y-1">
                <span className={ADMIN_LABEL}>Nome de exibição</span>
                <input
                  className={ADMIN_INPUT}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
              <label className="block space-y-1">
                <span className={ADMIN_LABEL}>URL do webhook</span>
                <input
                  className={ADMIN_INPUT}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={
                    metaQuery.data?.suggested_webhook_url ||
                    'https://api…/v1/webhooks/relayhub/'
                  }
                />
              </label>
              <label className="block space-y-1">
                <span className={ADMIN_LABEL}>Ambiente</span>
                <select
                  className={ADMIN_INPUT}
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                >
                  <option value="local">local</option>
                  <option value="staging">staging</option>
                  <option value="production">production</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className={BTN_SM}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className={BTN_SM}
                disabled={!instanceName.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir conexão?"
        description="A conexão será desativada e removida da operação. Esta ação não pode ser desfeita pela UI."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </AdminStaffGate>
  )
}

function Field({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy?: () => void
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#ededf2] bg-[#FAFAFB] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className={ADMIN_LABEL}>{label}</p>
        {onCopy && (
          <button type="button" onClick={onCopy} className="text-[#7132f5] hover:opacity-80">
            <Copy className="size-3.5" />
          </button>
        )}
      </div>
      <p className="mt-0.5 truncate text-sm text-[#101114]" title={value}>
        {value}
      </p>
    </div>
  )
}
