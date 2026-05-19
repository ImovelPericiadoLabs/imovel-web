'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Copy,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'
import {
  createPartnerAccount,
  getPartnerAccount,
  listPartnerAccounts,
  topUpPartnerCredits,
  type PartnerAccount,
  type PartnerAccountDetail,
} from '@/services/staff/partner-accounts'

type Mode = 'idle' | 'create' | 'view'

function formatBRL(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR')
}

function reasonLabel(reason: string) {
  return reason === 'INITIAL'
    ? 'Inicial'
    : reason === 'TOP_UP'
      ? 'Recarga'
      : reason === 'ADJUSTMENT'
        ? 'Ajuste'
        : reason
}

export default function PartnerAccountsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [mode, setMode] = useState<Mode>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const canAccess = Boolean(me?.is_staff || me?.is_superuser)

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
    enabled: canAccess,
  })

  const detailQuery = useQuery({
    queryKey: ['partner-account-detail', selectedId],
    queryFn: () => getPartnerAccount(selectedId as string),
    enabled: Boolean(canAccess && selectedId),
  })

  const refreshList = async () => {
    await queryClient.invalidateQueries({ queryKey: ['partner-accounts'] })
  }

  if (!me) {
    return (
      <div className="px-4 py-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <Alert
          variant="warning"
          icon={<ShieldAlert className="size-5 shrink-0" />}
          message="Esta área é restrita à equipe (conta staff). Solicite permissão a um administrador."
        />
      </div>
    )
  }

  return (
    <div className="px-4 pb-10 space-y-6">
      <div className="space-y-1 pt-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <TextTitle>Contas de teste — parceiros</TextTitle>
            <TextSubtitle className="mt-1">
              Provisione contas com saldo de créditos para parceiros testarem o sistema.
              Os créditos podem ser usados em consultas reais.
            </TextSubtitle>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="!w-auto px-5 gap-2"
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
              className="!w-auto px-5 gap-2"
              onClick={() => {
                setMode('create')
                setSelectedId(null)
                setFeedback(null)
              }}
            >
              <UserPlus className="size-4" />
              Nova conta
            </Button>
          </div>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#101114]">
            <Users className="size-5 text-[#7132f5]" />
            Contas provisionadas ({listQuery.data?.count ?? '…'})
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9497a9]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nome ou whatsapp"
              className="w-full rounded-xl border border-[#dedee5] bg-white pl-10 pr-3 py-2.5 text-sm text-[#101114] outline-none focus:border-[#7132f5]"
            />
          </div>

          {listQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : (
            <ul className="space-y-3">
              {(listQuery.data?.results ?? []).map((row) => (
                <PartnerCard
                  key={row.id}
                  item={row}
                  active={selectedId === row.id}
                  onClick={() => {
                    setSelectedId(row.id)
                    setMode('view')
                    setFeedback(null)
                  }}
                />
              ))}
              {!listQuery.data?.results?.length && (
                <div className="rounded-2xl border border-dashed border-[#dedee5] p-8 text-center text-[#686b82]">
                  Nenhuma conta de teste cadastrada{searchDebounced ? ' para a busca atual.' : '.'}
                </div>
              )}
            </ul>
          )}

          <div className="flex justify-center gap-3 pt-4 flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="!w-auto px-6"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="flex items-center text-sm text-[#686b82]">Página {page}</span>
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

        <aside className="lg:sticky lg:top-4 h-fit space-y-4">
          <div className="rounded-2xl border border-[#dedee5] bg-white shadow-[rgba(0,0,0,0.03)_0px_4px_24px] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#dedee5] bg-[rgba(148,151,169,0.06)]">
              <span className="font-semibold text-[#101114]">
                {mode === 'create' ? 'Nova conta de parceiro' : 'Detalhe da conta'}
              </span>
              {(mode !== 'idle') && (
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-white/80 text-[#686b82]"
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
              <CreateAccountForm
                onSuccess={(account, sentInvite) => {
                  setFeedback({
                    kind: 'success',
                    message: sentInvite
                      ? `Conta provisionada para ${account.email} e e-mail de boas-vindas enviado.`
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
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : detailQuery.data ? (
                <AccountDetailPanel
                  account={detailQuery.data}
                  onTopUpSuccess={() => {
                    setFeedback({ kind: 'success', message: 'Créditos adicionados.' })
                    void refreshList()
                  }}
                  onError={(message) => setFeedback({ kind: 'error', message })}
                />
              ) : (
                <div className="p-6 text-sm text-[#686b82]">Detalhe indisponível.</div>
              )
            ) : (
              <div className="p-6 text-sm text-[#686b82]">
                Selecione uma conta à esquerda ou clique em <b>Nova conta</b> para provisionar.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#dedee5] bg-[rgba(133,91,251,0.06)] p-4 text-sm text-[#484b5e]">
            <p className="font-semibold text-[#5741d8] mb-1">Como funciona</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Crie a conta com o e-mail do parceiro e o saldo inicial em créditos.</li>
              <li>Se marcar “enviar convite”, o parceiro recebe um e-mail com as instruções de acesso.</li>
              <li>O parceiro faz login normalmente; o saldo concedido aparece para uso nas consultas.</li>
              <li>Adicione mais créditos a qualquer momento; o histórico fica registrado.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PartnerCard({
  item,
  active,
  onClick,
}: {
  item: PartnerAccount
  active: boolean
  onClick: () => void
}) {
  const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim()
  const balance = formatBRL(item.credits_balance)

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-2xl border transition shadow-[rgba(0,0,0,0.03)_0px_4px_24px] p-4',
          active
            ? 'border-[#7132f5] bg-[rgba(133,91,251,0.06)]'
            : 'border-[#dedee5] bg-white hover:border-[#5741d8]',
        )}
      >
        <div className="flex justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-[#101114] truncate">
              {fullName || item.email}
            </p>
            {fullName && (
              <p className="text-sm text-[#686b82] truncate flex items-center gap-1.5">
                <Mail className="size-3.5" /> {item.email}
              </p>
            )}
            <p className="text-xs text-[#9497a9] mt-1">
              Criada em {formatDate(item.created)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-[#026b3f] bg-[rgba(20,158,97,0.16)] px-2 py-0.5 rounded-md font-semibold text-sm">
              <Coins className="size-3.5" />
              {balance}
            </div>
            {!item.is_active && (
              <p className="text-xs text-red-600 mt-1">Inativa</p>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}

function CreateAccountForm({
  onSuccess,
  onError,
}: {
  onSuccess: (account: PartnerAccountDetail, sentInvite: boolean) => void
  onError: (message: string) => void
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [credits, setCredits] = useState('100')
  const [notes, setNotes] = useState('')
  const [sendInvite, setSendInvite] = useState(true)

  const mutation = useMutation({
    mutationFn: createPartnerAccount,
    onSuccess: (account) => {
      onSuccess(account, sendInvite)
      setEmail('')
      setFirstName('')
      setLastName('')
      setWhatsapp('')
      setCredits('100')
      setNotes('')
    },
    onError: (err: unknown) => {
      onError(err instanceof Error ? err.message : 'Falha ao criar a conta.')
    },
  })

  const valid = email.trim().length > 3 && Number(credits) >= 0

  return (
    <form
      className="p-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid || mutation.isPending) return
        mutation.mutate({
          email: email.trim(),
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          whatsapp: whatsapp.replace(/\D/g, '') || undefined,
          initial_credits: Number(credits),
          notes: notes.trim() || undefined,
          send_invite_email: sendInvite,
        })
      }}
    >
      <Field label="E-mail do parceiro *">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parceiro@empresa.com"
          className={INPUT_BASE}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={INPUT_BASE}
          />
        </Field>
        <Field label="Sobrenome">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={INPUT_BASE}
          />
        </Field>
      </div>

      <Field label="WhatsApp (somente números, opcional)">
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="11999999999"
          className={INPUT_BASE}
        />
      </Field>

      <Field label="Créditos iniciais (R$) *">
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className={INPUT_BASE}
        />
      </Field>

      <Field label="Notas internas (opcional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex.: Parceria com Imobiliária X"
          className={`${INPUT_BASE} resize-none`}
        />
      </Field>

      <label className="flex items-start gap-2 text-sm text-[#484b5e]">
        <input
          type="checkbox"
          checked={sendInvite}
          onChange={(e) => setSendInvite(e.target.checked)}
          className="mt-0.5 size-4 rounded border-[#dedee5] text-[#7132f5] focus:ring-[#7132f5]"
        />
        Enviar e-mail de boas-vindas com instruções de acesso
      </label>

      <Button
        type="submit"
        disabled={!valid || mutation.isPending}
        className="w-full gap-2"
      >
        {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Provisionar conta
      </Button>
    </form>
  )
}

const INPUT_BASE =
  'w-full rounded-xl border border-[#dedee5] bg-white px-3 py-2.5 text-sm text-[#101114] outline-none transition-colors focus:border-[#7132f5]'

function AccountDetailPanel({
  account,
  onTopUpSuccess,
  onError,
}: {
  account: PartnerAccountDetail
  onTopUpSuccess: () => void
  onError: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpNotes, setTopUpNotes] = useState('')
  const [copied, setCopied] = useState(false)

  const topUpMutation = useMutation({
    mutationFn: () =>
      topUpPartnerCredits(account.id, {
        amount: Number(topUpAmount),
        notes: topUpNotes.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partner-account-detail', account.id] })
      setTopUpAmount('')
      setTopUpNotes('')
      onTopUpSuccess()
    },
    onError: (err: unknown) => {
      onError(err instanceof Error ? err.message : 'Falha ao adicionar créditos.')
    },
  })

  const fullName = useMemo(
    () => `${account.first_name ?? ''} ${account.last_name ?? ''}`.trim(),
    [account],
  )

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(account.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      onError('Não foi possível copiar o e-mail.')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-[#9497a9]">Parceiro</p>
        <p className="text-lg font-bold text-[#101114]">{fullName || account.email}</p>
        {fullName && <p className="text-sm text-[#686b82]">{account.email}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#dedee5] p-3">
          <p className="text-xs text-[#9497a9]">Saldo atual</p>
          <p className="text-lg font-bold text-[#026b3f]">{formatBRL(account.credits_balance)}</p>
        </div>
        <div className="rounded-xl border border-[#dedee5] p-3">
          <p className="text-xs text-[#9497a9]">Último crédito</p>
          <p className="text-sm font-medium text-[#101114]">{formatDate(account.last_grant_at)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={copyEmail}
        className="flex items-center gap-2 w-full text-left text-sm rounded-xl border border-dashed border-[#dedee5] p-3 hover:border-[#7132f5]"
      >
        <Mail className="size-4 text-[#7132f5]" />
        <span className="truncate flex-1">{account.email}</span>
        {copied ? (
          <span className="text-xs text-[#026b3f] flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Copiado
          </span>
        ) : (
          <Copy className="size-4 text-[#9497a9]" />
        )}
      </button>

      <div className="border-t border-[#dedee5] pt-4 space-y-3">
        <p className="text-sm font-semibold text-[#101114] flex items-center gap-2">
          <Coins className="size-4 text-[#7132f5]" /> Adicionar créditos
        </p>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          placeholder="Valor em R$"
          className="w-full rounded-xl border border-[#dedee5] px-3 py-2.5 text-sm bg-white text-[#101114] outline-none focus:border-[#7132f5]"
        />
        <input
          type="text"
          value={topUpNotes}
          onChange={(e) => setTopUpNotes(e.target.value)}
          placeholder="Notas (opcional)"
          className="w-full rounded-xl border border-[#dedee5] px-3 py-2.5 text-sm bg-white text-[#101114] outline-none focus:border-[#7132f5]"
        />
        <Button
          type="button"
          className="w-full gap-2"
          disabled={!topUpAmount || Number(topUpAmount) <= 0 || topUpMutation.isPending}
          onClick={() => topUpMutation.mutate()}
        >
          {topUpMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Creditar
        </Button>
      </div>

      <div className="border-t border-[#dedee5] pt-4">
        <p className="text-sm font-semibold text-[#101114] mb-2">Histórico de concessões</p>
        {account.grants.length === 0 ? (
          <p className="text-sm text-[#686b82]">Nenhuma concessão registrada.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {account.grants.map((grant) => (
              <li key={grant.id} className="rounded-lg border border-[#dedee5] p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#026b3f]">+{formatBRL(grant.amount)}</span>
                  <span className="text-xs text-[#9497a9]">{reasonLabel(grant.reason)}</span>
                </div>
                <p className="text-xs text-[#686b82] mt-1">
                  Saldo após: {formatBRL(grant.balance_after)} • {formatDate(grant.created)}
                </p>
                {grant.granted_by_email && (
                  <p className="text-xs text-[#9497a9]">por {grant.granted_by_email}</p>
                )}
                {grant.notes && <p className="text-xs text-[#484b5e] mt-1 italic">“{grant.notes}”</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[#686b82] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
