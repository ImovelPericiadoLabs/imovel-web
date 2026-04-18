import type { MetadataRoute } from 'next'

/**
 * Web App Manifest — permite “Adicionar à tela inicial” / instalação como PWA.
 * Documentação: https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Imóvel Periciado',
    short_name: 'Imóvel Periciado',
    description:
      'Consulta e perícia de imóveis com fluxo digital, documentos e acompanhamento.',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'any',
    background_color: '#F6F5FA',
    theme_color: '#0b1b3a',
    categories: ['business', 'finance', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}
