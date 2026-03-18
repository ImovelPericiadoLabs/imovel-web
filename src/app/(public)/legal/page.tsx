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
    <section className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="size-3.5" />
            Área institucional
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Documentos legais
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              As páginas abaixo carregam o conteúdo administrado no backend e são exibidas em iframe para manter a atualização centralizada.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {legalDocuments.map((document) => (
            <Link
              key={document.slug}
              href={getLegalRoute(document.slug)}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_70px_rgba(15,23,42,0.10)]"
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {document.slug}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-950">{document.title}</h2>
                    <p className="text-sm leading-6 text-slate-600">{document.description}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
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

