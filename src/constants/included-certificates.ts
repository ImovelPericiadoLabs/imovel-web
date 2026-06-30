/** Official certificates included in every complete consultation. */

export type IncludedCertificate = {
  id: string
  name: string
  description: string
  scope: 'owner' | 'property'
}

export const INCLUDED_CERTIFICATES: IncludedCertificate[] = [
  {
    id: 'federal',
    name: 'CND Federal',
    description: 'Débitos tributários federais e Dívida Ativa da União.',
    scope: 'owner',
  },
  {
    id: 'trabalhista',
    name: 'CNDT Trabalhista',
    description: 'Débitos trabalhistas perante o Ministério do Trabalho.',
    scope: 'owner',
  },
  {
    id: 'estadual',
    name: 'CND Estadual (SEFAZ)',
    description: 'Débitos tributários estaduais na UF do imóvel.',
    scope: 'owner',
  },
  {
    id: 'fgts',
    name: 'Regularidade FGTS',
    description: 'Situação perante o FGTS para titulares CNPJ.',
    scope: 'owner',
  },
  {
    id: 'cnj',
    name: 'CNJ — Improbidade',
    description: 'Condenações por improbidade e inelegibilidade.',
    scope: 'owner',
  },
  {
    id: 'cgu',
    name: 'CGU — Certidão correcional',
    description: 'CEIS, CNEP, CEPIM e sanções correcionais.',
    scope: 'owner',
  },
  {
    id: 'onus_imovel',
    name: 'Certidão de ônus reais',
    description: 'Gravames e restrições registradas sobre o imóvel (ARISP).',
    scope: 'property',
  },
  {
    id: 'iptu_sp',
    name: 'IPTU — São Paulo',
    description: 'Certidão tributária municipal quando o imóvel for em SP.',
    scope: 'property',
  },
  {
    id: 'iptu_rj',
    name: 'IPTU — Rio de Janeiro',
    description: 'Certidão fiscal municipal quando o imóvel for no RJ.',
    scope: 'property',
  },
]

export const INCLUDED_CERTIFICATES_COUNT = INCLUDED_CERTIFICATES.length

export const ANALYSIS_VALUE_BULLETS = [
  'Leitura assistida por IA da matrícula e dos documentos enviados',
  'Sinais de risco, pendências e pontos que merecem atenção antes de negociar',
  'Relatório em linguagem clara para apoiar sua decisão com segurança',
] as const
