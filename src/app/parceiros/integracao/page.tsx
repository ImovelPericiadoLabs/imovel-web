import type { Metadata } from 'next'

import { PartnerConsole } from '@/sections/partner-console'

export const metadata: Metadata = {
  title: 'Console de Integração — Imóvel Periciado',
  description: 'Configure sua integração de parceiro: branding e callbacks.',
  robots: { index: false, follow: false },
}

export default function PartnerIntegrationConsolePage() {
  return <PartnerConsole />
}
