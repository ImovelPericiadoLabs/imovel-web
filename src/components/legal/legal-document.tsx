'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { BrandLogoLink } from '@/components/brand-logo-link'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, ChevronRight, FileText, Shield, UserMinus } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute } from '@/constants/legal'
import { cn } from '@/utils/tailwind'

type LegalDocumentProps = {
  slug: LegalDocumentSlug
  /** Página HTML completa da API (mesmo render do Django Admin / URL direta). */
  fullDocumentHtml: string
}

const LEGAL_DOC_ICONS: Record<LegalDocumentSlug, LucideIcon> = {
  'politica-de-privacidade': Shield,
  'termos-de-servico': FileText,
  'exclusao-de-dados': UserMinus,
}

function useLegalIframeAutoHeight(
  fullDocumentHtml: string,
  iframeRef: RefObject<HTMLIFrameElement | null>,
) {
  const syncHeight = useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!iframe || !doc?.documentElement) return
    const html = doc.documentElement
    const body = doc.body
    const h = Math.max(
      body?.scrollHeight ?? 0,
      body?.offsetHeight ?? 0,
      html.scrollHeight,
      html.offsetHeight,
      html.clientHeight,
    )
    if (h > 0) iframe.style.height = `${h}px`
  }, [iframeRef])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let ro: ResizeObserver | null = null

    const stopObserving = () => {
      ro?.disconnect()
      ro = null
    }

    const onLoad = () => {
      stopObserving()
      syncHeight()
      const doc = iframe.contentDocument
      if (!doc?.documentElement) return
      ro = new ResizeObserver(() => requestAnimationFrame(syncHeight))
      ro.observe(doc.documentElement)
      if (doc.body) ro.observe(doc.body)
    }

    iframe.addEventListener('load', onLoad)
    if (iframe.contentDocument?.readyState === 'complete') {
      onLoad()
    }

    return () => {
      iframe.removeEventListener('load', onLoad)
      stopObserving()
    }
  }, [fullDocumentHtml, iframeRef, syncHeight])
}

export default function LegalDocument({ slug, fullDocumentHtml }: LegalDocumentProps) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const document = useMemo(
    () => legalDocuments.find((item) => item.slug === slug) ?? legalDocuments[0],
    [slug],
  )

  useLegalIframeAutoHeight(fullDocumentHtml, iframeRef)

  function handleGoBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background,#F6F5FA)]">
      <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--color-gray-200,#E9EAEB)] bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(11,27,58,0.04)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-gray-200,#E9EAEB)] bg-white text-[#0b1b3a] shadow-sm transition hover:bg-[#F6F5FA]"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden shrink-0 sm:block">
              <BrandLogoLink tone="on-light" className="w-[8rem] sm:w-[8.75rem] [&_img]:h-10 sm:[&_img]:h-11" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#535862] sm:text-[11px]">
                Imóvel Periciado · Centro legal
              </p>
              <h1 className="text-pretty text-[0.9375rem] font-semibold leading-snug text-[#0b1b3a] sm:text-base">
                {document.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="border-b border-[var(--color-gray-200,#E9EAEB)] bg-gradient-to-b from-[#F6F5FA] to-[#eeeef4] px-4 py-4 sm:px-6 sm:py-5"
        aria-label="Documentos legais"
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#686b82]">
              Escolha o documento
            </h2>
            <span className="hidden text-[11px] font-medium text-[#9497a9] sm:inline">
              {legalDocuments.length} disponíveis
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-3 lg:gap-3">
            {legalDocuments.map((item) => {
              const active = item.slug === document.slug
              const Icon = LEGAL_DOC_ICONS[item.slug]
              return (
                <li key={item.slug}>
                  <Link
                    href={getLegalRoute(item.slug)}
                    prefetch={false}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex min-h-[4.75rem] gap-3 overflow-hidden rounded-2xl border p-3.5 pl-4 shadow-sm transition lg:min-h-[5.25rem]',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[#7132f5]/50 focus-visible:ring-offset-2',
                      active
                        ? 'border-[#7132f5]/40 bg-white ring-2 ring-[#7132f5]/20'
                        : 'border-[var(--color-gray-200,#E9EAEB)] bg-white/90 hover:border-[#7132f5]/30 hover:bg-white',
                    )}
                  >
                    {active && (
                      <span
                        className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-[#7132f5]"
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl transition',
                        active
                          ? 'bg-gradient-to-br from-[#7132f5] to-[#5741d8] text-white shadow-md shadow-[#7132f5]/25'
                          : 'bg-[#F4EBFF] text-[#7132f5] group-hover:bg-[#ede9fe]',
                      )}
                    >
                      <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
                    </span>
                    <span className="min-w-0 flex-1 pr-7">
                      <span
                        className={cn(
                          'block text-sm font-semibold leading-tight tracking-tight',
                          active ? 'text-[#0b1b3a]' : 'text-[#1a2540] group-hover:text-[#0b1b3a]',
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-[#686b82] line-clamp-2 sm:text-xs sm:leading-relaxed">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        'pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 shrink-0',
                        active ? 'text-[#7132f5]' : 'text-[#bdbdc7] transition group-hover:translate-x-0.5 group-hover:text-[#7132f5]',
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="w-full flex-1 pb-6 pt-2 sm:pb-8">
        <iframe
          ref={iframeRef}
          title={document.title}
          srcDoc={fullDocumentHtml}
          className="block w-full overflow-hidden border-0 border-t border-[var(--color-gray-200,#E9EAEB)] bg-[#f6f5fa] sm:border-b"
          style={{ colorScheme: 'light', height: '1px' }}
          sandbox="allow-scripts allow-same-origin"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
