'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute } from '@/constants/legal'

type LegalDocumentProps = {
  slug: LegalDocumentSlug
  contentHtml: string
}

export default function LegalDocument({ slug, contentHtml }: LegalDocumentProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const document = useMemo(() => legalDocuments.find((item) => item.slug === slug) ?? legalDocuments[0], [slug])

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(10,26,54,0.08),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                <ShieldCheck className="size-3.5" />
                Documento oficial
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

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.10)]">
              <div className="border-b border-slate-200 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Documento
              </div>

              <div className="relative min-h-[78vh] bg-white">
                {!isLoaded && (
                  <div className="absolute inset-0 z-10 p-4">
                    <div className="h-full rounded-[20px] border border-slate-200 bg-slate-50 p-5">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 w-36 rounded-full bg-slate-200" />
                        <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
                        <div className="space-y-3 pt-2">
                          <div className="h-3 w-full rounded-full bg-slate-200" />
                          <div className="h-3 w-11/12 rounded-full bg-slate-200" />
                          <div className="h-3 w-10/12 rounded-full bg-slate-200" />
                          <div className="h-3 w-9/12 rounded-full bg-slate-200" />
                          <div className="h-3 w-8/12 rounded-full bg-slate-200" />
                        </div>
                        <div className="grid gap-3 pt-4">
                          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
                          <div className="h-24 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <iframe
                  title={document.title}
                  srcDoc={contentHtml}
                  className="h-[78vh] w-full bg-white"
                  loading="lazy"
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

