'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type OAuthState = 'loading' | 'error' | 'success'

export function JetimobCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<OAuthState>('loading')
  const [message, setMessage] = useState('Conectando à Jetimob…')

  useEffect(() => {
    const code = searchParams.get('code')?.trim()
    const oauthError = searchParams.get('error')?.trim()

    if (oauthError) {
      setState('error')
      setMessage(oauthError)
      return
    }

    if (!code) {
      setState('error')
      setMessage('Código de autorização ausente na URL.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/jetimob/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const body = await res.json().catch(() => ({}))

        if (!res.ok) {
          if (!cancelled) {
            setState('error')
            setMessage(body?.error?.message || 'Falha ao trocar o código OAuth.')
          }
          return
        }

        if (!cancelled) {
          setState('success')
          setMessage('Conectado. Redirecionando…')
          router.replace('/integrations/jetimob')
        }
      } catch {
        if (!cancelled) {
          setState('error')
          setMessage('Erro de rede ao conectar.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4">
      {state === 'loading' && (
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
      )}
      <h1 className="text-lg font-semibold text-gray-900">Integração Jetimob</h1>
      <p className={`text-sm max-w-md ${state === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
        {message}
      </p>
      {state === 'error' && (
        <button
          type="button"
          onClick={() => router.push('/integrations/jetimob')}
          className="text-sm text-primary underline"
        >
          Voltar ao painel
        </button>
      )}
    </div>
  )
}
