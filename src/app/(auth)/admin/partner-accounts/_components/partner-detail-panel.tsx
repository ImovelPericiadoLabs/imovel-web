'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Coins,
  Copy,
  Loader2,
  Mail,
  Plus,
  Trash2,
} from 'lucide-react'
import Button from '@/components/button'
import { ADMIN_CARD, ADMIN_INPUT } from '@/components/admin'
import {
  topUpPartnerCredits,
  type PartnerAccountDetail,
} from '@/services/staff/partner-accounts'
import { formatBRL, formatDate, partnerDisplayName, reasonLabel } from './partner-utils'

type Props = {
  account: PartnerAccountDetail
  onTopUpSuccess: () => void
  onError: (message: string) => void
  onRequestRemove: () => void
}

export default function PartnerDetailPanel({
  account,
  onTopUpSuccess,
  onError,
  onRequestRemove,
}: Props) {
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
    () => partnerDisplayName(account.first_name, account.last_name, account.email),
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
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9497a9]">
            Parceiro
          </p>
          <p className="truncate text-lg font-bold text-[#101114]">{fullName}</p>
          {fullName !== account.email && (
            <p className="truncate text-sm text-[#686b82]">{account.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRequestRemove}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#FEE4E2] bg-[#FEF3F2] px-3 py-2 text-xs font-semibold text-[#D92D20] transition hover:bg-[#FEE4E2]"
          aria-label="Remover conta de parceiro"
        >
          <Trash2 className="size-3.5" />
          Remover
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${ADMIN_CARD} p-3 shadow-none`}>
          <p className="text-xs text-[#9497a9]">Saldo atual</p>
          <p className="text-lg font-bold text-[#026b3f] tabular-nums">
            {formatBRL(account.credits_balance)}
          </p>
        </div>
        <div className={`${ADMIN_CARD} p-3 shadow-none`}>
          <p className="text-xs text-[#9497a9]">Último crédito</p>
          <p className="text-sm font-medium text-[#101114]">
            {formatDate(account.last_grant_at)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={copyEmail}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#dedee5] p-3 text-left text-sm transition hover:border-[#7132f5]"
      >
        <Mail className="size-4 shrink-0 text-[#7132f5]" />
        <span className="min-w-0 flex-1 truncate">{account.email}</span>
        {copied ? (
          <span className="flex items-center gap-1 text-xs text-[#026b3f]">
            <CheckCircle2 className="size-3.5" /> Copiado
          </span>
        ) : (
          <Copy className="size-4 shrink-0 text-[#9497a9]" />
        )}
      </button>

      {account.whatsapp && (
        <p className="text-xs text-[#686b82]">
          WhatsApp: <span className="font-medium text-[#101114]">{account.whatsapp}</span>
        </p>
      )}

      <div className="space-y-3 border-t border-[#dedee5] pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#101114]">
          <Coins className="size-4 text-[#7132f5]" />
          Adicionar créditos
        </p>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          placeholder="Valor em R$"
          className={ADMIN_INPUT}
        />
        <input
          type="text"
          value={topUpNotes}
          onChange={(e) => setTopUpNotes(e.target.value)}
          placeholder="Notas (opcional)"
          className={ADMIN_INPUT}
        />
        <Button
          type="button"
          className="w-full gap-2"
          disabled={!topUpAmount || Number(topUpAmount) <= 0 || topUpMutation.isPending}
          onClick={() => topUpMutation.mutate()}
        >
          {topUpMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Creditar
        </Button>
      </div>

      <div className="border-t border-[#dedee5] pt-4">
        <p className="mb-2 text-sm font-semibold text-[#101114]">Histórico de concessões</p>
        {account.grants.length === 0 ? (
          <p className="text-sm text-[#686b82]">Nenhuma concessão registrada.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {account.grants.map((grant) => (
              <li key={grant.id} className="rounded-xl border border-[#dedee5] p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#026b3f] tabular-nums">
                    +{formatBRL(grant.amount)}
                  </span>
                  <span className="text-xs text-[#9497a9]">{reasonLabel(grant.reason)}</span>
                </div>
                <p className="mt-1 text-xs text-[#686b82]">
                  Saldo após {formatBRL(grant.balance_after)} · {formatDate(grant.created)}
                </p>
                {grant.granted_by_email && (
                  <p className="text-xs text-[#9497a9]">por {grant.granted_by_email}</p>
                )}
                {grant.notes && (
                  <p className="mt-1 text-xs italic text-[#484b5e]">“{grant.notes}”</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
