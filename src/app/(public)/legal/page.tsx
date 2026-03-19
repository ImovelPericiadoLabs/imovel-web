import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { legalDocuments, getLegalRoute } from '@/constants/legal'

export const metadata: Metadata = {
  title: 'Documentos legais | Imóvel Periciado',
  description: 'Acesse Política de Privacidade, Termos de Serviço e Exclusão de Dados.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function LegalHubPage() {
  return (
    <section className="min-h-screen bg-[var(--color-background,#F6F5FA)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
            <ShieldCheck className="size-3.5 text-[#0b1b3a]" />
            Área institucional
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1b3a] sm:text-4xl">
              Documentos legais
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              Conteúdo atualizado diretamente no servidor. Escolha um documento para leitura em página única, responsiva e acessível.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {legalDocuments.map((document) => (
            <Link
              key={document.slug}
              href={getLegalRoute(document.slug)}
              prefetch={false}
              className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_24px_rgba(11,27,58,0.06)] transition hover:border-[#0b1b3a]/20 hover:shadow-[0_8px_32px_rgba(11,27,58,0.08)]"
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {document.slug}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">{document.title}</h2>
                    <p className="text-sm leading-6 text-slate-600">{document.description}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b1b3a]">
                  Abrir documento
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

