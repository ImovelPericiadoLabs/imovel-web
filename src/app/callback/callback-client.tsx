'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { AlertCircle, ArrowRight, ExternalLink, Link2, Mail } from 'lucide-react'

import Button from '@/components/button'
import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_HEIGHT, BRAND_LOGO_WIDTH } from '@/constants/brand-logo'
import { InputOtp } from '@/sections/login/components/InputOtp'
import { startAuth } from '@/services/account'
import {
  AUTH_CODE_TTL_SECONDS,
  resendCodeLabel,
  secondsUntilExpiry,
  validityLabel,
} from '@/sections/login/auth-code-copy'

const JETIMOB_PANEL_URL = 'https://app.jetimob.io'
const EMAIL_RE = /^\S+@\S+\.\S+$/

const TAGLINES = [
  'Matrícula analisada por IA em minutos',
  'Riscos jurídicos revelados antes da venda',
  'Relatório pericial pronto para compartilhar',
  'Consultas direto da sua carteira de imóveis',
]

type FlowState =
  | 'exchanging'
  | 'auth-email'
  | 'auth-code'
  | 'binding'
  | 'success'
  | 'expired'
  | 'failed'

type AuthPurpose = 'bind' | 'retry'

function AnimationStyles() {
  return (
    <style>{`
      @keyframes jm-dash { to { stroke-dashoffset: -24; } }
      @keyframes jm-draw { to { stroke-dashoffset: 0; } }
      @keyframes jm-pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
      @keyframes jm-ring { 0% { transform: scale(0.9); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
      @keyframes jm-hand { to { transform: rotate(360deg); } }
      @keyframes jm-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes jm-travel { 0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(52px); opacity: 0; } }
      .jm-fade-up { animation: jm-fade-up 0.45s ease-out both; }
      .jm-travel { animation: jm-travel 1.3s ease-in-out infinite; }
      .jm-dash { stroke-dasharray: 6 6; animation: jm-dash 1s linear infinite; }
      .jm-draw-circle { stroke-dasharray: 1; stroke-dashoffset: 1; animation: jm-draw 0.5s ease-out forwards; }
      .jm-draw-check { stroke-dasharray: 1; stroke-dashoffset: 1; animation: jm-draw 0.35s ease-out 0.45s forwards; }
      .jm-pop { animation: jm-pop 0.4s ease-out both; }
      .jm-ring { animation: jm-ring 1.6s ease-out infinite; }
      .jm-hand { transform-origin: 32px 32px; animation: jm-hand 2.4s linear infinite; }
    `}</style>
  )
}

function BrandMark({ size = 'size-14' }: { size?: string }) {
  return (
    <span className={`relative flex ${size} items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25`}>
      <span className="absolute inset-0 rounded-2xl border-2 border-primary/30 jm-ring" />
      <Image src="/images/logo.svg" alt="" width={28} height={27} className="w-3/5" aria-hidden />
    </span>
  )
}

function ConnectingAnimation() {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      <BrandMark />

      <span className="relative">
        <svg width="72" height="24" viewBox="0 0 72 24" className="text-primary/50">
          <line x1="4" y1="12" x2="68" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="jm-dash" />
        </svg>
        <span className="jm-travel absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full bg-primary" />
      </span>

      <span className="relative flex size-14 items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <span className="absolute inset-0 rounded-2xl border-2 border-gray-300/60 jm-ring" style={{ animationDelay: '0.8s' }} />
        <Link2 className="size-6 text-gray-400" />
      </span>
    </div>
  )
}

function RotatingTaglines() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TAGLINES.length), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mt-6 flex h-8 items-center justify-center" aria-live="polite">
      <p
        key={index}
        className="jm-fade-up rounded-full bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
      >
        {TAGLINES[index]}
      </p>
    </div>
  )
}

function BrandFooter() {
  return (
    <div className="mt-12 flex flex-col items-center gap-1.5">
      <Image
        src={BRAND_LOGO_DARK_SRC}
        alt="Imóvel Periciado"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        className="h-7 w-auto object-contain opacity-60"
      />
      <p className="text-[11px] text-gray-400">Perícia imobiliária com inteligência artificial</p>
    </div>
  )
}

function SuccessAnimation() {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" className="jm-pop" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="4" pathLength="1" className="jm-draw-circle" />
      <path d="M20 33 L28 41 L44 25" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="jm-draw-check" />
    </svg>
  )
}

function ExpiredAnimation() {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" className="jm-pop" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#f59e0b" strokeWidth="4" />
      <line x1="32" y1="32" x2="32" y2="16" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" className="jm-hand" />
      <line x1="32" y1="32" x2="42" y2="36" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3" fill="#f59e0b" />
    </svg>
  )
}

export function JetimobCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status: sessionStatus } = useSession()

  const [flow, setFlow] = useState<FlowState>('exchanging')
  const [exchanged, setExchanged] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [authPurpose, setAuthPurpose] = useState<AuthPurpose>('bind')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [resendTimer, setResendTimer] = useState(59)
  const [validSeconds, setValidSeconds] = useState(AUTH_CODE_TTL_SECONDS)

  const exchangeRef = useRef(false)

  useEffect(() => {
    if (exchangeRef.current) return
    exchangeRef.current = true

    const oauthCode = searchParams.get('code')?.trim()
    const oauthError = searchParams.get('error')?.trim()

    if (oauthError || !oauthCode) {
      setErrorMsg(oauthError || 'Código de autorização ausente na URL.')
      setFlow('expired')
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/jetimob/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: oauthCode }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setErrorMsg(body?.error?.message || '')
          setFlow(res.status === 400 || res.status === 401 ? 'expired' : 'failed')
          return
        }

        setExchanged(true)
      } catch {
        setErrorMsg('Sem conexão com o servidor.')
        setFlow('failed')
      }
    })()
  }, [searchParams])

  useEffect(() => {
    if (!exchanged || sessionStatus === 'loading') return
    if (flow !== 'exchanging') return

    if (sessionStatus === 'authenticated') {
      setFlow('success')
    } else {
      setAuthPurpose('bind')
      setFlow('auth-email')
    }
  }, [exchanged, sessionStatus, flow])

  useEffect(() => {
    if (flow !== 'success') return
    const id = setTimeout(() => router.replace('/integrations/jetimob'), 1600)
    return () => clearTimeout(id)
  }, [flow, router])

  useEffect(() => {
    if (flow !== 'auth-code' || resendTimer === 0) return
    const id = setInterval(() => setResendTimer((t) => (t <= 1 ? 0 : t - 1)), 1000)
    return () => clearInterval(id)
  }, [flow, resendTimer])

  useEffect(() => {
    if (flow !== 'auth-code') return
    const id = setInterval(() => setValidSeconds((t) => (t <= 0 ? 0 : t - 1)), 1000)
    return () => clearInterval(id)
  }, [flow])

  const sendCode = useCallback(async () => {
    if (!EMAIL_RE.test(email)) {
      setAuthError('Digite um e-mail válido.')
      return
    }

    setAuthBusy(true)
    setAuthError('')
    try {
      const sent = await startAuth({ email })
      setCode('')
      setValidSeconds(secondsUntilExpiry(sent?.expires_at))
      setResendTimer(59)
      setFlow('auth-code')
    } catch {
      setAuthError('Não foi possível enviar o código. Aguarde alguns instantes e tente de novo.')
    } finally {
      setAuthBusy(false)
    }
  }, [email])

  const verifyCode = useCallback(async () => {
    if (code.length < 6 || authBusy) return

    setAuthBusy(true)
    setAuthError('')
    try {
      const result = await signIn('credentials', { email, code, redirect: false })

      if (result?.error) {
        setAuthError(result.error.replace('Error: ', '') || 'Código incorreto ou expirado.')
        return
      }

      if (authPurpose === 'retry') {
        setFlow('expired')
        return
      }

      setFlow('binding')
      const res = await fetch('/api/jetimob/bind', { method: 'POST' })

      if (res.ok) {
        setFlow('success')
      } else {
        // Conexão perdida entre a troca e o login: orienta a refazer, agora logado.
        setErrorMsg('')
        setFlow('expired')
      }
    } catch {
      setAuthError('Ocorreu um erro ao validar o código.')
    } finally {
      setAuthBusy(false)
    }
  }, [authBusy, authPurpose, code, email])

  const isLogged = sessionStatus === 'authenticated'

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-10">
      <AnimationStyles />

      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {flow === 'exchanging' && (
          <>
            <ConnectingAnimation />
            <h1 className="mt-8 text-xl font-bold text-gray-900">Conectando sua carteira…</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Estamos validando sua autorização. Em instantes seus imóveis estarão prontos para
              consulta.
            </p>
            <RotatingTaglines />
          </>
        )}

        {flow === 'auth-email' && (
          <>
            {authPurpose === 'bind' ? (
              <>
                <SuccessAnimation />
                <h1 className="mt-6 text-xl font-bold text-gray-900">Conta Jetimob conectada!</h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Falta um passo: informe seu e-mail para entrar — ou criar sua conta na hora — e
                  deixar suas consultas vinculadas a você.
                </p>
              </>
            ) : (
              <>
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-8 text-primary" aria-hidden />
                </div>
                <h1 className="mt-6 text-xl font-bold text-gray-900">Entre para continuar</h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Informe seu e-mail para entrar ou criar sua conta. Depois é só refazer a conexão
                  pelo painel da Jetimob — ela ficará vinculada a você automaticamente.
                </p>
              </>
            )}

            <form
              className="mt-6 flex w-full flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                void sendCode()
              }}
            >
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition focus-within:border-primary">
                <Mail className="size-5 shrink-0 text-gray-400" aria-hidden />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setAuthError('')
                  }}
                  placeholder="seu@email.com"
                  autoFocus
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                />
              </label>

              {authError && (
                <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {authError}
                </p>
              )}

              <Button
                type="submit"
                disabled={authBusy}
                className="h-12 w-full rounded-xl"
                icon={<ArrowRight className="size-5" />}
              >
                {authBusy ? 'Enviando código…' : 'Continuar'}
              </Button>
            </form>

            <p className="mt-4 text-xs leading-relaxed text-gray-400">
              Sem senha: enviamos um código de 6 dígitos para o seu e-mail.
            </p>
          </>
        )}

        {flow === 'auth-code' && (
          <>
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-8 text-primary" aria-hidden />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Confira seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Enviamos um código de 6 dígitos para{' '}
              <span className="font-medium text-gray-900">{email}</span>.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Use o e-mail mais recente.
            </p>
            <p className="mt-1 text-xs font-medium text-primary">{validityLabel(validSeconds)}</p>
            <button
              type="button"
              onClick={() => setFlow('auth-email')}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              Alterar e-mail
            </button>

            <form
              className="mt-6 flex w-full flex-col items-center gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                void verifyCode()
              }}
            >
              <InputOtp
                value={code}
                onChange={(val) => {
                  setCode(val)
                  setAuthError('')
                }}
                length={6}
                isError={!!authError}
                autoFocus
              />

              {authError && (
                <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  <AlertCircle className="size-4 shrink-0" aria-hidden />
                  {authError}
                </p>
              )}

              <div className="text-xs text-gray-500">
                {resendTimer === 0 ? (
                  <button
                    type="button"
                    onClick={() => void sendCode()}
                    disabled={authBusy}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {resendCodeLabel(validSeconds, false)}
                  </button>
                ) : (
                  <span className="font-medium text-primary">Reenviar em {resendTimer}s</span>
                )}
              </div>

              <Button type="submit" disabled={authBusy || code.length < 6} className="h-12 w-full rounded-xl">
                {authBusy ? 'Verificando…' : 'Confirmar'}
              </Button>
            </form>
          </>
        )}

        {flow === 'binding' && (
          <>
            <BrandMark />
            <h1 className="mt-6 text-xl font-bold text-gray-900">Vinculando à sua conta…</h1>
            <p className="mt-2 text-sm text-gray-500">Só um instante.</p>
            <RotatingTaglines />
          </>
        )}

        {flow === 'success' && (
          <>
            <SuccessAnimation />
            <h1 className="mt-6 text-xl font-bold text-gray-900">Tudo pronto!</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Sua conta Jetimob está conectada. Levando você para a sua carteira de imóveis…
            </p>
          </>
        )}

        {flow === 'expired' && (
          <>
            <ExpiredAnimation />
            <h1 className="mt-6 text-xl font-bold text-gray-900">
              {isLogged ? 'Quase lá — refaça a conexão' : 'O código de conexão expirou'}
            </h1>

            {errorMsg && <p className="mt-2 text-xs text-gray-400">{errorMsg}</p>}

            {isLogged ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Sua conta está pronta. Volte ao painel da Jetimob e clique em{' '}
                  <span className="font-medium text-gray-900">acessar</span> no app Imóvel
                  Periciado — desta vez a conexão fica vinculada a você automaticamente. Leva menos
                  de um minuto.
                </p>
                <Button
                  href={JETIMOB_PANEL_URL}
                  className="mt-6 h-12 w-full rounded-xl"
                  icon={<ExternalLink className="size-5" />}
                >
                  Abrir painel da Jetimob
                </Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Acontece! O código de autorização vale por pouco tempo. Entre na sua conta
                  primeiro — assim, quando você refizer a conexão, tudo já fica vinculado
                  automaticamente.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setAuthPurpose('retry')
                    setAuthError('')
                    setFlow('auth-email')
                  }}
                  className="mt-6 h-12 w-full rounded-xl"
                  icon={<ArrowRight className="size-5" />}
                >
                  Entrar ou criar conta
                </Button>
                <Button
                  href={JETIMOB_PANEL_URL}
                  variant="outline"
                  className="mt-2 h-12 w-full rounded-xl"
                  icon={<ExternalLink className="size-5" />}
                >
                  Refazer conexão sem entrar
                </Button>
              </>
            )}
          </>
        )}

        {flow === 'failed' && (
          <>
            <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="size-8 text-red-500" aria-hidden />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Não conseguimos conectar</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {errorMsg || 'Houve um problema de comunicação com o servidor.'} Tente novamente em
              instantes.
            </p>
            <Button
              href={JETIMOB_PANEL_URL}
              className="mt-6 h-12 w-full rounded-xl"
              icon={<ExternalLink className="size-5" />}
            >
              Refazer conexão na Jetimob
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/integrations/jetimob')}
              className="mt-2 h-12 w-full rounded-xl"
            >
              Ir para a central de integração
            </Button>
          </>
        )}

        <BrandFooter />
      </div>
    </div>
  )
}
