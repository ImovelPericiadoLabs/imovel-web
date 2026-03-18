import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LegalDocument from './legal-document'

describe('LegalDocument', () => {
  it('renders the backend iframe for the selected document', () => {
    render(<LegalDocument slug="termos-de-servico" />)

    expect(screen.getByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByTitle('Termos de Serviço')).toHaveAttribute(
      'src',
      'https://api.imovelpericiado.com/legal/termos-de-servico/',
    )
    expect(screen.getByRole('link', { name: 'Voltar para documentos' })).toHaveAttribute('href', '/legal')
  })
})

