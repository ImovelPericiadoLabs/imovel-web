'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute } from '@/constants/legal'

type LegalDocumentProps = {
  slug: LegalDocumentSlug
  /** Página HTML completa da API (mesmo render do Django Admin / URL direta). */
  fullDocumentHtml: string
}

export default function LegalDocument({ slug, fullDocumentHtml }: LegalDocumentProps) {
  const router = useRouter()

  const document = useMemo(
    () => legalDocuments.find((item) => item.slug === slug) ?? legalDocuments[0],
    [slug],
  )

  function handleGoBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background,#F6F5FA)]">
      <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]">
              Documentos legais
            </p>
            <h1 className="truncate text-base font-semibold text-[#0b1b3a] sm:text-lg">{document.title}</h1>
          </div>
        </div>

        <nav
          className="mx-auto max-w-6xl border-t border-slate-100 px-3 pb-3 pt-2 sm:px-5 lg:px-8"
          aria-label="Escolher documento"
        >
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {legalDocuments.map((item) => {
              const active = item.slug === document.slug
              return (
                <Link
                  key={item.slug}
                  href={getLegalRoute(item.slug)}
                  prefetch={false}
                  className={[
                    'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition sm:min-h-11 sm:px-4',
                    active
                      ? 'bg-[#0b1b3a] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {item.title}
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <iframe
          title={document.title}
          srcDoc={fullDocumentHtml}
          className="block w-full min-h-[70vh] rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:min-h-[75vh]"
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
