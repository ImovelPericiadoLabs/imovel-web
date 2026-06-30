'use client'

import { Building2, CheckCircle2 } from 'lucide-react'

export function ReviewStep({
  orgName,
  logoUrl,
  description,
  website,
  redirectUris,
  consentClientId,
}: {
  orgName?: string
  logoUrl: string
  description: string
  website: string
  redirectUris: string[]
  consentClientId: string | null
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-6 text-emerald-500" />
        <div>
          <h2 className="text-lg font-bold text-primary">Tudo certo</h2>
          <p className="text-sm text-gray-500">Revise sua configuração. Você pode editar quando quiser.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="size-full object-contain" />
          ) : (
            <Building2 className="size-6 text-gray-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-primary">{orgName || 'Sua empresa'}</p>
          {description && <p className="line-clamp-2 text-sm text-gray-500">{description}</p>}
          {website && <p className="truncate text-xs text-primary/70">{website}</p>}
        </div>
      </div>

      <Row label="Callbacks">
        {redirectUris.length === 0 ? (
          <span className="text-sm text-gray-400">{consentClientId === null ? 'Não disponível' : 'Nenhum'}</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {redirectUris.map((u) => (
              <li key={u} className="truncate font-mono text-[13px] text-gray-700">
                {u}
              </li>
            ))}
          </ul>
        )}
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </div>
  )
}
