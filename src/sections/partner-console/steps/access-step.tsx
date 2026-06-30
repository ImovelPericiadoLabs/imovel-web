'use client'

import { useState } from 'react'

import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'

import { Field, PrimaryButton } from '../field'

export function AccessStep({
  onLogin,
  loading,
  error,
}: {
  onLogin: (clientId: string, clientSecret: string) => void
  loading: boolean
  error: string | null
}) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [reveal, setReveal] = useState(false)

  const canSubmit = clientId.trim().length > 0 && clientSecret.trim().length > 0 && !loading

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (canSubmit) onLogin(clientId.trim(), clientSecret.trim())
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/5 text-primary">
          <KeyRound className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary">Acesse seu console</h2>
          <p className="mt-1 text-sm text-gray-500">
            Use o <strong>Client ID</strong> e o <strong>Client Secret</strong> que você recebeu por
            e-mail para configurar sua integração.
          </p>
        </div>
      </div>

      <Field
        label="Client ID"
        placeholder="imovel_xxxxxxxxxxxxxxxx"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />

      <label className="flex w-full flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Client Secret</span>
        <div className="relative">
          <input
            type={reveal ? 'text' : 'password'}
            placeholder="••••••••••••••••"
            autoComplete="off"
            spellCheck={false}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="w-full rounded-xl border border-input-border bg-white px-4 py-3 pr-11 text-sm text-dark outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Ocultar' : 'Mostrar'}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-400 hover:text-gray-600"
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" loading={loading} disabled={!canSubmit}>
        Acessar
      </PrimaryButton>

      <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <span>
          Suas chaves são usadas apenas no servidor para gerar um token temporário e ficam cifradas —
          nunca são expostas no navegador.
        </span>
      </div>
    </form>
  )
}
