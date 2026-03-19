import Link from 'next/link'
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import type { LegalDocument } from '@/constants/legal'
import { getLegalRoute } from '@/constants/legal'

type LegalDocumentErrorPanelProps = {
  document: LegalDocument
  reason?: 'network' | 'unknown'
}

export function LegalDocumentErrorPanel({ document, reason = 'network' }: LegalDocumentErrorPanelProps) {
  const message =
    reason === 'network'
      ? 'Não foi possível carregar o texto deste documento agora. Verifique a conexão ou tente de novo em instantes.'
      : 'Não encontramos este documento na lista atual. Use os links abaixo para acessar a versão oficial.'

  return (
    <section className="min-h-screen bg-[var(--color-background,#F6F5FA)]">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            <ShieldCheck className="size-3.5 text-[#0b1b3a]" />
            {document.title}
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-[#0b1b3a] sm:text-2xl">Conteúdo indisponível</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{message}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={getLegalRoute(document.slug)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1b3a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142a5b]"
            >
              <RefreshCw className="size-4" />
              Tentar de novo
            </Link>
            <Link
              href="/legal"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" />
              Todos os documentos
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
