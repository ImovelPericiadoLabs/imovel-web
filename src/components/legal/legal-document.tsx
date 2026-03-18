'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute, getLegalSourceUrl } from '@/constants/legal'

type LegalDocumentProps = {
  slug: LegalDocumentSlug
}

export default function LegalDocument({ slug }: LegalDocumentProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const document = useMemo(() => legalDocuments.find((item) => item.slug === slug) ?? legalDocuments[0], [slug])
  const sourceUrl = getLegalSourceUrl(document.slug)

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(10,26,54,0.08),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                <ShieldCheck className="size-3.5" />
                Conteúdo legal
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {document.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {document.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="size-4" />
                Abrir origem
              </a>
              <Link
                href="/legal"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <ArrowLeft className="size-4" />
                Voltar para documentos
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Documentos disponíveis</p>
              <div className="mt-4 space-y-2">
                {legalDocuments.map((item) => {
                  const isActive = item.slug === document.slug

                  return (
                    <Link
                      key={item.slug}
                      href={getLegalRoute(item.slug)}
                      className={`block rounded-xl border px-3 py-3 transition ${
                        isActive
                          ? 'border-primary bg-primary/5 text-slate-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                    </Link>
                  )
                })}
              </div>
            </aside>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-[0_30px_80px_rgba(2,6,23,0.15)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                <span>Espelho do backend</span>
                <span className="inline-flex items-center gap-2">
                  {isLoaded ? <RotateCcw className="size-3.5" /> : <LoaderCircle className="size-3.5 animate-spin" />}
                  {isLoaded ? 'Atualizado' : 'Carregando'}
                </span>
              </div>

              <div className="relative bg-white">
                {!isLoaded && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                      <LoaderCircle className="size-4 animate-spin text-primary" />
                      Sincronizando conteúdo legal
                    </div>
                  </div>
                )}
                <iframe
                  title={document.title}
                  src={sourceUrl}
                  className="h-[78vh] w-full bg-white"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsLoaded(true)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

