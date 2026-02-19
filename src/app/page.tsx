import type { Metadata } from 'next'
import VslPage from '@/sections/vsl/vsl-page'

export const metadata: Metadata = {
  title: 'Consultar Imóvel | Consulta rápida e segura',
  description: 'Consulta rápida que revela informações essenciais do imóvel com segurança e simplicidade.',
  openGraph: {
    title: 'Consultar Imóvel | Consulta rápida e segura',
    description: 'Consulta rápida que revela informações essenciais do imóvel com segurança e simplicidade.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Consultar Imóvel | Consulta rápida e segura',
    description: 'Consulta rápida que revela informações essenciais do imóvel com segurança e simplicidade.',
  },
}

export default function ConsultarImovelPage() {
  return <VslPage />
}