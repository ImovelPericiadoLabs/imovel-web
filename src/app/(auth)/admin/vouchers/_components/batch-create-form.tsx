'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import Alert from '@/components/alert'
import Button from '@/components/button'
import { ADMIN_INPUT, ADMIN_LABEL } from '@/components/admin'
import {
  BENEFIT_KIND_LABEL,
  ENTRY_PATH_LABEL,
  type BenefitKind,
  type CreateBatchPayload,
  type EntryPath,
} from '@/services/staff/vouchers'

const ENTRY_PATHS: EntryPath[] = ['document', 'registry', 'address']

type Props = {
  onSubmit: (payload: CreateBatchPayload & { quantity: number }) => void
  onCancel: () => void
  isPending: boolean
  error?: string | null
}

export default function BatchCreateForm({ onSubmit, onCancel, isPending, error }: Props) {
  const [name, setName] = useState('')
  const [eventName, setEventName] = useState('')
  const [creditAmount, setCreditAmount] = useState('79.90')
  const [quantity, setQuantity] = useState('300')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  /**
   * Uma regra por modalidade. O benefício varia entre elas — o caso real é consulta
   * grátis por documento e 50% de desconto por endereço e matrícula, no mesmo voucher.
   * Só "Por Documento" vem marcada porque é a modalidade impressa na arte.
   */
  const [rules, setRules] = useState<Record<EntryPath, { on: boolean; kind: BenefitKind; value: string }>>({
    document: { on: true, kind: 'FREE', value: '' },
    registry: { on: false, kind: 'PERCENT', value: '50' },
    address: { on: false, kind: 'PERCENT', value: '50' },
  })

  const setRule = (path: EntryPath, patch: Partial<{ on: boolean; kind: BenefitKind; value: string }>) =>
    setRules((prev) => ({ ...prev, [path]: { ...prev[path], ...patch } }))

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)

    const selected = ENTRY_PATHS.filter((path) => rules[path].on)
    if (!selected.length) {
      setLocalError('Selecione ao menos uma modalidade.')
      return
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      setLocalError('A data final precisa ser posterior à inicial.')
      return
    }

    for (const path of selected) {
      const { kind, value } = rules[path]
      if (kind === 'FREE') continue
      const numeric = Number(value)
      if (!value.trim() || Number.isNaN(numeric) || numeric <= 0) {
        setLocalError(`Informe o desconto de ${ENTRY_PATH_LABEL[path]}.`)
        return
      }
      if (kind === 'PERCENT' && numeric > 100) {
        setLocalError(`O desconto de ${ENTRY_PATH_LABEL[path]} não pode passar de 100%.`)
        return
      }
    }

    onSubmit({
      name: name.trim(),
      event_name: eventName.trim(),
      credit_amount: creditAmount,
      benefits: selected.map((path) => ({
        entry_path: path,
        kind: rules[path].kind,
        value: rules[path].kind === 'FREE' ? null : rules[path].value,
      })),
      max_vouchers: Number(quantity),
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      // Nasce em rascunho: o lote só resgata quando alguém ativa, de propósito.
      // Assim os códigos podem ser impressos dias antes sem valer nada ainda.
      status: 'DRAFT',
      quantity: Number(quantity),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {(localError || error) && <Alert variant="error" message={localError || error || ""} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-event">Evento</label>
          <input
            id="batch-event" className={ADMIN_INPUT} required value={eventName}
            onChange={(e) => setEventName(e.target.value)} placeholder="JetExperience"
          />
        </div>
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-name">Nome do lote</label>
          <input
            id="batch-name" className={ADMIN_INPUT} required value={name}
            onChange={(e) => setName(e.target.value)} placeholder="JetExperience 2026 - Lote 1"
          />
        </div>
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-amount">Valor do voucher (R$)</label>
          <input
            id="batch-amount" className={ADMIN_INPUT} required inputMode="decimal"
            value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)}
          />
        </div>
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-quantity">Quantidade</label>
          <input
            id="batch-quantity" className={ADMIN_INPUT} required type="number" min={1}
            value={quantity} onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-from">Válido de</label>
          <input
            id="batch-from" className={ADMIN_INPUT} required type="datetime-local"
            value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>
        <div>
          <label className={ADMIN_LABEL} htmlFor="batch-until">Válido até</label>
          <input
            id="batch-until" className={ADMIN_INPUT} required type="datetime-local"
            value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className={ADMIN_LABEL}>Benefício por modalidade</legend>
        <p className="mb-3 text-xs text-[#686b82]">
          Cada modalidade pode ter um benefício diferente — por exemplo, consulta
          grátis por documento e 50% de desconto por endereço. O texto impresso no
          verso do cartão sai desta escolha.
        </p>
        <div className="flex flex-col gap-2">
          {ENTRY_PATHS.map((path) => {
            const rule = rules[path]
            return (
              <div
                key={path}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e4e5ea] px-3 py-2"
              >
                <label className="flex min-w-[150px] cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={rule.on}
                    onChange={(e) => setRule(path, { on: e.target.checked })}
                  />
                  {ENTRY_PATH_LABEL[path]}
                </label>

                <select
                  // max-w e não w-auto: ADMIN_INPUT traz `w-full`, e entre duas
                  // utilitárias de width quem vence é a ordem no CSS do Tailwind,
                  // não a ordem na string de classes.
                  className={`${ADMIN_INPUT} max-w-[190px]`}
                  value={rule.kind}
                  disabled={!rule.on}
                  onChange={(e) => setRule(path, { kind: e.target.value as BenefitKind })}
                >
                  {(Object.keys(BENEFIT_KIND_LABEL) as BenefitKind[]).map((kind) => (
                    <option key={kind} value={kind}>{BENEFIT_KIND_LABEL[kind]}</option>
                  ))}
                </select>

                {rule.on && rule.kind !== 'FREE' && (
                  <input
                    className={`${ADMIN_INPUT} max-w-[110px]`}
                    inputMode="decimal"
                    value={rule.value}
                    onChange={(e) => setRule(path, { value: e.target.value })}
                    placeholder={rule.kind === 'PERCENT' ? '50' : '39.90'}
                    aria-label={`Desconto de ${ENTRY_PATH_LABEL[path]}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={isPending} className="w-auto px-6">
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Criar lote e emitir vouchers
        </Button>
        <Button
          type="button" variant="outline" onClick={onCancel} disabled={isPending}
          className="w-auto px-6"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
