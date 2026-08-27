'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import Alert from '@/components/alert'
import Button from '@/components/button'
import { ADMIN_INPUT, ADMIN_LABEL } from '@/components/admin'
import {
  ENTRY_PATH_LABEL,
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
  // Padrão é só "Por Documento": é a modalidade impressa na arte do voucher.
  const [services, setServices] = useState<EntryPath[]>(['document'])
  const [localError, setLocalError] = useState<string | null>(null)

  function toggleService(path: EntryPath) {
    setServices((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)

    if (!services.length) {
      setLocalError('Selecione ao menos um serviço permitido.')
      return
    }
    if (new Date(validUntil) <= new Date(validFrom)) {
      setLocalError('A data final precisa ser posterior à inicial.')
      return
    }

    onSubmit({
      name: name.trim(),
      event_name: eventName.trim(),
      credit_amount: creditAmount,
      allowed_entry_paths: services,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <legend className={ADMIN_LABEL}>Serviços permitidos</legend>
        <p className="mb-2 text-xs text-[#686b82]">
          O voucher só pode ser usado nas modalidades marcadas. O texto impresso no
          verso do cartão sai desta escolha.
        </p>
        <div className="flex flex-wrap gap-2">
          {ENTRY_PATHS.map((path) => (
            <label
              key={path}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e4e5ea] px-3 py-2 text-sm"
            >
              <input
                type="checkbox" checked={services.includes(path)}
                onChange={() => toggleService(path)}
              />
              {ENTRY_PATH_LABEL[path]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Criar lote e emitir vouchers
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
