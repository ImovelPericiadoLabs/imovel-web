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

const LEGAL_SLUG_ALIASES: Record<string, LegalDocumentSlug> = {
  politica: 'politica-de-privacidade',
  privacidade: 'politica-de-privacidade',
  'politica-privacidade': 'politica-de-privacidade',
  privacy: 'politica-de-privacidade',
  terms: 'termos-de-servico',
  termos: 'termos-de-servico',
  exclusao: 'exclusao-de-dados',
  'exclusao-dados': 'exclusao-de-dados',
}

function normalizeLegalSlugInput(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().replace(/\/+$/g, '').toLowerCase()
  } catch {
    return raw.trim().replace(/\/+$/g, '').toLowerCase()
  }
}

export function getLegalDocument(slug: string) {
  const key = normalizeLegalSlugInput(slug)
  if (key in legalDocumentBySlug) {
    return legalDocumentBySlug[key as LegalDocumentSlug]
  }
  const alias = LEGAL_SLUG_ALIASES[key]
  if (alias) {
    return legalDocumentBySlug[alias]
  }
  return null
}

export function getLegalRoute(slug: LegalDocumentSlug) {
  return `/legal/${slug}`
}

