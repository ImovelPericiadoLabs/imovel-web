import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegalDocument from '@/components/legal/legal-document'
import { getLegalDocument, legalDocuments, type LegalDocumentSlug } from '@/constants/legal'

type LegalDocumentPageProps = {
  params: {
    slug: string
  }
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const document = getLegalDocument(params.slug)

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

export default function LegalDocumentPage({ params }: LegalDocumentPageProps) {
  const { slug } = params
  const document = getLegalDocument(slug)

  if (!document) {
    notFound()
  }

  return <LegalDocument slug={document.slug as LegalDocumentSlug} />
}

