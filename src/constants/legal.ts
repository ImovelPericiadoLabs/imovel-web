export type LegalDocumentSlug =
  | 'politica-de-privacidade'
  | 'termos-de-servico'
  | 'exclusao-de-dados'

export type LegalDocument = {
  slug: LegalDocumentSlug
  title: string
  description: string
}

export const legalDocuments: LegalDocument[] = [
  {
    slug: 'politica-de-privacidade',
    title: 'Política de Privacidade',
    description: 'Como coletamos, usamos e protegemos os seus dados.',
  },
  {
    slug: 'termos-de-servico',
    title: 'Termos de Serviço',
    description: 'Regras de uso, limitações e responsabilidades da plataforma.',
  },
  {
    slug: 'exclusao-de-dados',
    title: 'Exclusão de Dados',
    description: 'Como solicitar a desativação da conta e a retenção temporária.',
  },
]

const legalDocumentBySlug = legalDocuments.reduce<Record<LegalDocumentSlug, LegalDocument>>(
  (acc, document) => {
    acc[document.slug] = document
    return acc
  },
  {} as Record<LegalDocumentSlug, LegalDocument>,
)

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, '')
}

export function getLegalDocument(slug: string) {
  return legalDocumentBySlug[slug as LegalDocumentSlug] ?? null
}

export function getLegalRoute(slug: LegalDocumentSlug) {
  return `/legal/${slug}`
}

export function getLegalSourceUrl(slug: LegalDocumentSlug) {
  const baseUrl = process.env.NEXT_PUBLIC_LEGAL_BASE_URL
    || process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '')
    || 'https://api.imovelpericiado.com'

  return `${normalizeBaseUrl(baseUrl)}/legal/${slug}/`
}

