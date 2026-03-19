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
    <section className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[24px] border border-amber-200/90 bg-amber-50/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 ring-1 ring-amber-200">
            <ShieldCheck className="size-3.5" />
            {document.title}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Conteúdo indisponível</h1>
          <p className="mt-3 text-base leading-7 text-slate-700">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={getLegalRoute(document.slug)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              <RefreshCw className="size-4" />
              Tentar de novo
            </Link>
            <Link
              href="/legal"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
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
