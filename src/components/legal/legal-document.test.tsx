import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import LegalDocument from './legal-document'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}))

describe('LegalDocument', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockPush.mockReset()
  })

  it('renders the legal document without exposing the source', async () => {
    render(<LegalDocument slug="termos-de-servico" contentHtml="<html><body><main>Termos</main></body></html>" />)

    await waitFor(() => {
      expect(screen.getByTitle('Termos de Serviço')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByTitle('Termos de Serviço')).toHaveAttribute('srcdoc', '<html><body><main>Termos</main></body></html>')
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /abrir origem/i })).not.toBeInTheDocument()
  })

  it('navigates back to the previous page', async () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    })

    render(<LegalDocument slug="termos-de-servico" contentHtml="<html><body><main>Termos</main></body></html>" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    })

    screen.getByRole('button', { name: 'Voltar' }).click()

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})

