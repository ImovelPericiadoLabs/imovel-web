'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { legalDocuments, type LegalDocumentSlug, getLegalRoute } from '@/constants/legal'

type LegalDocumentProps = {
  slug: LegalDocumentSlug
  /** HTML já extraído do `<main>` (sem iframe). */
  contentHtml: string
}

const embedStyles = `
.legal-doc-embed .legal-skeleton,
.legal-doc-embed .legal-toc-mobile,
.legal-doc-embed .legal-toc-desktop {
  display: none !important;
}
.legal-doc-embed #legal-doc-title {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.legal-doc-embed .legal-content {
  counter-reset: legal-section;
}
.legal-doc-embed .legal-content h2 {
  counter-increment: legal-section;
  scroll-margin-top: 5rem;
}
.legal-doc-embed .legal-content h2::before {
  content: counter(legal-section) ". ";
  color: #0b1b3a;
  font-weight: 800;
  margin-right: 0.35em;
}
`

export default function LegalDocument({ slug, contentHtml }: LegalDocumentProps) {
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
    <div className="min-h-screen bg-[var(--color-background,#F6F5FA)] pb-12 pt-0">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Documentos legais</p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-[#0b1b3a] sm:text-xl">
                {document.title}
              </h1>
            </div>
          </div>
        </div>

        <nav
          className="mx-auto max-w-5xl border-t border-slate-100 px-2 pb-3 pt-2 sm:px-4 lg:px-8"
          aria-label="Escolher documento"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {legalDocuments.map((item) => {
              const active = item.slug === document.slug
              return (
                <Link
                  key={item.slug}
                  href={getLegalRoute(item.slug)}
                  className={[
                    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition',
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(11,27,58,0.06)]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <FileText className="size-4 text-[#0b1b3a]" aria-hidden />
              <span>Texto fornecido pela plataforma e atualizado no servidor.</span>
            </div>
          </div>

          <div className="px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            <style dangerouslySetInnerHTML={{ __html: embedStyles }} />
            <div
              className={[
                'legal-doc-embed max-w-3xl',
                /* Tipografia do bloco injetado */
                '[&_.legal-eyebrow]:mb-2 [&_.legal-eyebrow]:inline-block [&_.legal-eyebrow]:text-[11px] [&_.legal-eyebrow]:font-bold [&_.legal-eyebrow]:uppercase [&_.legal-eyebrow]:tracking-[0.14em] [&_.legal-eyebrow]:text-[#0b1b3a]',
                '[&_.legal-meta]:mb-8 [&_.legal-meta]:border-b [&_.legal-meta]:border-slate-200 [&_.legal-meta]:pb-6 [&_.legal-meta]:text-sm [&_.legal-meta]:text-slate-500',
                '[&_.legal-content]:text-[15px] [&_.legal-content]:leading-[1.75] [&_.legal-content]:text-slate-700',
                '[&_.legal-content_p]:mb-4 [&_.legal-content_p]:last:mb-0',
                '[&_.legal-content_a]:font-medium [&_.legal-content_a]:text-[#142a5b] [&_.legal-content_a]:underline [&_.legal-content_a]:decoration-slate-300 [&_.legal-content_a]:underline-offset-[3px] [&_.legal-content_a]:transition-colors hover:[&_.legal-content_a]:text-[#0b1b3a]',
                '[&_.legal-content_a]:break-words',
                '[&_.legal-content_h2]:mt-10 [&_.legal-content_h2]:scroll-mt-24 [&_.legal-content_h2]:border-b [&_.legal-content_h2]:border-slate-100 [&_.legal-content_h2]:pb-2 [&_.legal-content_h2]:text-lg [&_.legal-content_h2]:font-semibold [&_.legal-content_h2]:text-[#0b1b3a] first:[&_.legal-content_h2]:mt-0',
                '[&_.legal-content_h3]:mt-8 [&_.legal-content_h3]:text-base [&_.legal-content_h3]:font-semibold [&_.legal-content_h3]:text-slate-900',
                '[&_.legal-content_ul]:my-4 [&_.legal-content_ul]:list-disc [&_.legal-content_ul]:space-y-2 [&_.legal-content_ul]:pl-6',
                '[&_.legal-content_ol]:my-4 [&_.legal-content_ol]:list-decimal [&_.legal-content_ol]:space-y-2 [&_.legal-content_ol]:pl-6',
                '[&_.legal-content_li]:pl-1',
                '[&_.legal-content_blockquote]:my-5 [&_.legal-content_blockquote]:border-l-4 [&_.legal-content_blockquote]:border-[#0b1b3a]/25 [&_.legal-content_blockquote]:bg-slate-50 [&_.legal-content_blockquote]:py-3 [&_.legal-content_blockquote]:pl-4 [&_.legal-content_blockquote]:pr-2 [&_.legal-content_blockquote]:text-slate-700',
                '[&_.legal-content_pre]:my-5 [&_.legal-content_pre]:max-w-full [&_.legal-content_pre]:overflow-x-auto [&_.legal-content_pre]:rounded-xl [&_.legal-content_pre]:border [&_.legal-content_pre]:border-slate-200 [&_.legal-content_pre]:bg-slate-50 [&_.legal-content_pre]:p-4 [&_.legal-content_pre]:text-sm',
                '[&_.legal-content_code]:rounded-md [&_.legal-content_code]:bg-slate-100 [&_.legal-content_code]:px-1.5 [&_.legal-content_code]:py-0.5 [&_.legal-content_code]:text-[0.9em]',
              ].join(' ')}
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </article>
      </main>
    </div>
  )
}
