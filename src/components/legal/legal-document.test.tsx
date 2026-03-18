import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LegalDocument from './legal-document'

describe('LegalDocument', () => {
  it('renders the legal document without exposing the source', async () => {
    render(<LegalDocument slug="termos-de-servico" contentHtml="<html><body><main>Termos</main></body></html>" />)

    await waitFor(() => {
      expect(screen.getByTitle('Termos de Serviço')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByTitle('Termos de Serviço')).toHaveAttribute('srcdoc', '<html><body><main>Termos</main></body></html>')
    expect(screen.getByRole('link', { name: 'Voltar para documentos' })).toHaveAttribute('href', '/legal')
    expect(screen.queryByRole('link', { name: /abrir origem/i })).not.toBeInTheDocument()
  })
})

