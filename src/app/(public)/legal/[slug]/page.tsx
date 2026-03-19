import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LegalDocument from '@/components/legal/legal-document'
import { LegalDocumentErrorPanel } from '@/components/legal/legal-document-error-panel'
import { getLegalDocument, legalDocuments, type LegalDocumentSlug } from '@/constants/legal'

export const dynamic = 'force-dynamic'

type LegalDocumentPageProps = {
  params: Promise<{
    slug: string
  }>
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '')
}

async function fetchLegalDocumentHtml(slug: string) {
  const baseUrl = process.env.LEGAL_BACKEND_URL
    || process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '')
    || 'https://api.imovelpericiado.com'

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/legal/${slug}/`, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`Falha ao carregar documento legal ${slug}`)
  }

  return response.text()
}

export async function generateMetadata({ params }: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params
  const document = getLegalDocument(slug)

  if (!document) {
    return {
      title: 'Documento legal | Imóvel Periciado',
    }
  }

  return {
    title: `${document.title} | Imóvel Periciado`,
    description: document.description,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export function generateStaticParams() {
  return legalDocuments.map((document) => ({
    slug: document.slug,
  }))
}

export default async function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = await params
  const document = getLegalDocument(slug)

  if (!document) {
    redirect('/legal')
  }

  let contentHtml: string | null = null
  try {
    contentHtml = await fetchLegalDocumentHtml(document.slug)
  } catch {
    contentHtml = null
  }

  if (!contentHtml) {
    return <LegalDocumentErrorPanel document={document} reason="network" />
  }

  return <LegalDocument slug={document.slug as LegalDocumentSlug} contentHtml={contentHtml} />
}

