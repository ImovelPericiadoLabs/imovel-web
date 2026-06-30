'use client'

import { useCallback, useEffect, useState } from 'react'

import { Check, LogOut, Palette, Link2, ClipboardCheck, Loader2 } from 'lucide-react'

import {
  pcGetIntegration,
  pcLogin,
  pcLogout,
  pcPatchIntegration,
  pcUploadLogo,
  type IntegrationConfig,
  type PartnerContext,
} from '@/services/partner-console/integration'
import { cn } from '@/utils/tailwind'

import { PrimaryButton } from './field'
import { AccessStep } from './steps/access-step'
import { BrandingStep } from './steps/branding-step'
import { CallbacksStep } from './steps/callbacks-step'
import { ReviewStep } from './steps/review-step'

type Step = 'branding' | 'callbacks' | 'review'

const STEPS: { id: Step; label: string; icon: typeof Palette }[] = [
  { id: 'branding', label: 'Marca', icon: Palette },
  { id: 'callbacks', label: 'Callbacks', icon: Link2 },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
]

export function PartnerConsole() {
  const [authed, setAuthed] = useState(false)
  const [booting, setBooting] = useState(true)
  const [context, setContext] = useState<PartnerContext | null>(null)
  const [config, setConfig] = useState<IntegrationConfig | null>(null)

  // form
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [redirectUris, setRedirectUris] = useState<string[]>([])

  const [step, setStep] = useState<Step>('branding')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const hydrate = useCallback((cfg: IntegrationConfig, ctx: PartnerContext | null) => {
    setConfig(cfg)
    setContext(ctx)
    setLogoUrl(cfg.logo_url || '')
    setDescription(cfg.description || '')
    setWebsite(cfg.website || '')
    setRedirectUris(cfg.redirect_uris || [])
    setAuthed(true)
  }, [])

  // Sessão persistente: se o cookie ainda vale, entra direto.
  useEffect(() => {
    let alive = true
    pcGetIntegration()
      .then(({ integration, context }) => {
        if (alive) hydrate(integration, context)
      })
      .catch(() => {})
      .finally(() => alive && setBooting(false))
    return () => {
      alive = false
    }
  }, [hydrate])

  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text })
    window.setTimeout(() => setNotice(null), 3500)
  }, [])

  async function handleLogin(clientId: string, clientSecret: string) {
    setLoginError(null)
    setLoginLoading(true)
    try {
      await pcLogin(clientId, clientSecret)
      const { integration, context } = await pcGetIntegration()
      hydrate(integration, context)
      setStep('branding')
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Não foi possível autenticar.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await pcLogout().catch(() => {})
    setAuthed(false)
    setConfig(null)
    setContext(null)
  }

  async function handleUploadLogo(file: File) {
    setUploading(true)
    try {
      const { logo_url } = await pcUploadLogo(file)
      setLogoUrl(logo_url)
      flash('ok', 'Logo atualizado.')
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Falha ao enviar o logo.')
    } finally {
      setUploading(false)
    }
  }

  async function persist(
    payload: Partial<Pick<IntegrationConfig, 'redirect_uris' | 'website' | 'description'>>,
  ): Promise<boolean> {
    setSaving(true)
    try {
      const updated = await pcPatchIntegration(payload)
      setConfig(updated)
      flash('ok', 'Configuração salva.')
      return true
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Não foi possível salvar.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  function goTo(next: Step) {
    setStep(next)
  }

  async function saveAndNext() {
    if (step === 'branding') {
      const ok = await persist({ description, website })
      if (ok) goTo('callbacks')
    } else if (step === 'callbacks') {
      const ok = await persist({ redirect_uris: redirectUris })
      if (ok) goTo('review')
    }
  }

  function skip() {
    if (step === 'branding') goTo('callbacks')
    else if (step === 'callbacks') goTo('review')
  }

  if (booting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  if (!authed) {
    return (
      <Shell>
        <AccessStep onLogin={handleLogin} loading={loginLoading} error={loginError} />
      </Shell>
    )
  }

  return (
    <Shell
      orgName={context?.organization_name}
      onLogout={handleLogout}
    >
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = i < stepIndex
          const active = i === stepIndex
          const Icon = s.icon
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(s.id)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  active && 'bg-primary text-white',
                  done && 'bg-primary/10 text-primary',
                  !active && !done && 'bg-white text-gray-400 border border-gray-200',
                )}
              >
                <span className="grid size-5 place-items-center rounded-full bg-white/20">
                  {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <span className={cn('h-px flex-1', done ? 'bg-primary/30' : 'bg-gray-200')} />
              )}
            </li>
          )
        })}
      </ol>

      {notice && (
        <div
          className={cn(
            'mb-4 rounded-xl px-4 py-2.5 text-sm font-medium',
            notice.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200',
          )}
        >
          {notice.text}
        </div>
      )}

      {step === 'branding' && (
        <BrandingStep
          orgName={context?.organization_name}
          logoUrl={logoUrl}
          description={description}
          website={website}
          uploading={uploading}
          onUploadLogo={handleUploadLogo}
          onChangeDescription={setDescription}
          onChangeWebsite={setWebsite}
        />
      )}

      {step === 'callbacks' && (
        <CallbacksStep
          value={redirectUris}
          consentClientId={config?.consent_client_id ?? null}
          onChange={setRedirectUris}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          orgName={context?.organization_name}
          logoUrl={logoUrl}
          description={description}
          website={website}
          redirectUris={redirectUris}
          consentClientId={config?.consent_client_id ?? null}
        />
      )}

      {/* Footer nav */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            const prev = STEPS[stepIndex - 1]
            if (prev) goTo(prev.id)
          }}
          disabled={stepIndex === 0}
          className="text-sm font-medium text-gray-500 disabled:opacity-0"
        >
          Voltar
        </button>

        <div className="flex items-center gap-3">
          {step !== 'review' && (
            <button
              type="button"
              onClick={skip}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Pular
            </button>
          )}
          {step === 'review' ? (
            <PrimaryButton onClick={handleLogout}>
              Concluir
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={saveAndNext} loading={saving}>
              Salvar e continuar
            </PrimaryButton>
          )}
        </div>
      </div>
    </Shell>
  )
}

/* ── UI base do console ───────────────────────────────────────────────────── */

function Shell({
  children,
  orgName,
  onLogout,
}: {
  children: React.ReactNode
  orgName?: string
  onLogout?: () => void
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-white">
              <span className="text-sm font-black tracking-tight">IP</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Imóvel Periciado
              </p>
              <h1 className="text-base font-bold leading-tight text-primary">
                Console de Integração
              </h1>
            </div>
          </div>
          {onLogout && (
            <div className="flex items-center gap-3">
              {orgName && (
                <span className="hidden text-sm font-medium text-gray-600 sm:block">{orgName}</span>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300"
              >
                <LogOut className="size-3.5" />
                Sair
              </button>
            </div>
          )}
        </header>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_rgba(11,27,58,0.06)] sm:p-8">
          {children}
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Acesso seguro · as chaves ficam no servidor, nunca no navegador.
        </p>
      </div>
    </div>
  )
}
