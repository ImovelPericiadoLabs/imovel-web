'use client'

import { useState } from 'react'

import { Link2, Plus, Trash2, TriangleAlert } from 'lucide-react'

export function CallbacksStep({
  value,
  consentClientId,
  onChange,
}: {
  value: string[]
  consentClientId: string | null
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function add() {
    const v = draft.trim()
    if (!v) return
    if (!/^https:\/\//i.test(v)) {
      setError('O callback precisa começar com https://')
      return
    }
    if (value.includes(v)) {
      setError('Esse callback já está na lista.')
      return
    }
    onChange([...value, v])
    setDraft('')
    setError(null)
  }

  function remove(uri: string) {
    onChange(value.filter((u) => u !== uri))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-primary">Callbacks (redirect URIs)</h2>
        <p className="mt-1 text-sm text-gray-500">
          URLs https para onde redirecionamos o cliente após o consentimento (fluxo
          authorization_code).
        </p>
      </div>

      {consentClientId === null ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Sua integração de consentimento (authorization_code) ainda não foi provisionada. Fale com
            a equipe Imóvel Periciado para habilitar os callbacks.
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute inset-y-0 left-3 my-auto size-4 text-gray-400" />
                <input
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      add()
                    }
                  }}
                  placeholder="https://seu-sistema.com/callback"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="w-full rounded-xl border border-input-border bg-white py-3 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Plus className="size-4" />
                Adicionar
              </button>
            </div>
            {error && <span className="text-xs font-medium text-red-500">{error}</span>}
          </div>

          {value.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center text-sm text-gray-400">
              Nenhum callback cadastrado ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {value.map((uri) => (
                <li
                  key={uri}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-2.5"
                >
                  <span className="truncate font-mono text-[13px] text-gray-700">{uri}</span>
                  <button
                    type="button"
                    onClick={() => remove(uri)}
                    aria-label="Remover"
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
