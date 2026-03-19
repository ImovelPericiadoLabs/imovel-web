'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute } from '@/constants/legal'

const IFRAME_MIN_HEIGHT_PX = 320
const IFRAME_HEIGHT_PADDING_PX = 40

type LegalDocumentProps = {
  slug: LegalDocumentSlug
  contentHtml: string
}

function measureIframeContentHeight(iframe: HTMLIFrameElement): number | null {
  try {
    const doc = iframe.contentDocument
    if (!doc?.body) return null
    const root = doc.documentElement
    const body = doc.body
    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      root.clientHeight,
      root.scrollHeight,
      root.offsetHeight,
    )
  } catch {
    return null
  }
}

export default function LegalDocument({ slug, contentHtml }: LegalDocumentProps) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(IFRAME_MIN_HEIGHT_PX)
  const [frameReady, setFrameReady] = useState(false)

  const document = useMemo(
    () => legalDocuments.find((item) => item.slug === slug) ?? legalDocuments[0],
    [slug],
  )

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const h = measureIframeContentHeight(iframe)
    if (h != null && h > 0) {
      setIframeHeight(Math.max(IFRAME_MIN_HEIGHT_PX, h + IFRAME_HEIGHT_PADDING_PX))
    }
  }, [])

  useLayoutEffect(() => {
    setFrameReady(false)
    setIframeHeight(IFRAME_MIN_HEIGHT_PX)
  }, [contentHtml])

  useLayoutEffect(() => {
    if (!frameReady) return
    syncIframeHeight()
    const iframe = iframeRef.current
    const win = iframe?.contentWindow
    if (!win) return
    win.addEventListener('resize', syncIframeHeight)
    return () => win.removeEventListener('resize', syncIframeHeight)
  }, [frameReady, syncIframeHeight, contentHtml])

  function handleGoBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/')
  }

  function handleIframeLoad() {
    setFrameReady(true)
    requestAnimationFrame(() => {
      syncIframeHeight()
    })
  }

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(10,26,54,0.08),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[28px] sm:p-5">
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

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <ArrowLeft className="size-4" />
                Voltar
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start lg:gap-6">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 lg:max-w-none">
              <p className="text-sm font-semibold text-slate-900">Documentos disponíveis</p>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:mt-4 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {legalDocuments.map((item) => {
                  const isActive = item.slug === document.slug

                  return (
                    <Link
                      key={item.slug}
                      href={getLegalRoute(item.slug)}
                      className={`block min-w-[220px] max-w-full rounded-xl border px-3 py-3 break-words transition lg:min-w-0 ${
                        isActive
                          ? 'border-primary bg-primary/5 text-slate-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 sm:text-[13px]">{item.description}</span>
                    </Link>
                  )
                })}
              </div>
            </aside>

            <div className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(2,6,23,0.10)]">
              <div className="border-b border-slate-200 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Documento
              </div>

              <div className="relative min-h-[200px] bg-white">
                <iframe
                  ref={iframeRef}
                  title={document.title}
                  srcDoc={contentHtml}
                  onLoad={handleIframeLoad}
                  className="block w-full max-w-full border-0 bg-white transition-opacity duration-200 [overflow-anchor:none]"
                  style={{ height: iframeHeight }}
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
