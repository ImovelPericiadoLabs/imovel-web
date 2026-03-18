import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LegalHubPage from './page'

describe('LegalHubPage', () => {
  it('renders links for all legal documents', () => {
    render(<LegalHubPage />)

    expect(screen.getByRole('heading', { name: 'Documentos legais' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /política de privacidade/i })).toHaveAttribute(
      'href',
      '/legal/politica-de-privacidade',
    )
    expect(screen.getByRole('link', { name: /termos de serviço/i })).toHaveAttribute(
      'href',
      '/legal/termos-de-servico',
    )
    expect(screen.getByRole('link', { name: /exclusão de dados/i })).toHaveAttribute(
      'href',
      '/legal/exclusao-de-dados',
    )
  })
})

