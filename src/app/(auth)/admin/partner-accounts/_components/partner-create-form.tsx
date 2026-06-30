'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import Button from '@/components/button'
import { ADMIN_INPUT } from '@/components/admin'
import {
  createPartnerAccount,
  type PartnerAccountDetail,
} from '@/services/staff/partner-accounts'

type Props = {
  onSuccess: (account: PartnerAccountDetail, sentInvite: boolean) => void
  onError: (message: string) => void
}

export default function PartnerCreateForm({ onSuccess, onError }: Props) {
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
      className="space-y-4 p-4"
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
      <PartnerField label="E-mail do parceiro *">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parceiro@empresa.com"
          className={ADMIN_INPUT}
        />
      </PartnerField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PartnerField label="Nome">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={ADMIN_INPUT}
          />
        </PartnerField>
        <PartnerField label="Sobrenome">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={ADMIN_INPUT}
          />
        </PartnerField>
      </div>

      <PartnerField label="WhatsApp (opcional)">
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="11999999999"
          className={ADMIN_INPUT}
        />
      </PartnerField>

      <PartnerField label="Créditos iniciais (R$) *">
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className={ADMIN_INPUT}
        />
      </PartnerField>

      <PartnerField label="Notas internas (opcional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ex.: Parceria com Imobiliária X"
          className={`${ADMIN_INPUT} resize-none`}
        />
      </PartnerField>

      <label className="flex items-start gap-2 text-sm text-[#484b5e]">
        <input
          type="checkbox"
          checked={sendInvite}
          onChange={(e) => setSendInvite(e.target.checked)}
          className="mt-0.5 size-4 rounded border-[#dedee5] text-[#7132f5] focus:ring-[#7132f5]"
        />
        Enviar e-mail de boas-vindas com instruções de acesso
      </label>

      <Button type="submit" disabled={!valid || mutation.isPending} className="w-full gap-2">
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Provisionar conta
      </Button>
    </form>
  )
}

function PartnerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#686b82]">
        {label}
      </label>
      {children}
    </div>
  )
}
