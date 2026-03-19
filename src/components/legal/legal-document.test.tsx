import { render, screen } from '@testing-library/react'
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

const sampleFragment = `
  <div class="legal-ready">
    <p class="legal-eyebrow">Termos</p>
    <h1 id="legal-doc-title">Título interno</h1>
    <p class="legal-meta">Atualizado em 01/01/2025</p>
    <div class="legal-content"><p>Corpo do texto legal para teste.</p></div>
  </div>
`

describe('LegalDocument', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockPush.mockReset()
  })

  it('renderiza o documento a partir do HTML injetado (sem iframe)', () => {
    render(<LegalDocument slug="termos-de-servico" contentHtml={sampleFragment} />)

    expect(screen.getByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByText('Corpo do texto legal para teste.')).toBeInTheDocument()
    expect(screen.queryByTitle('Termos de Serviço')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /abrir origem/i })).not.toBeInTheDocument()
  })

  it('volta à página anterior ao clicar em Voltar', () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    })

    render(<LegalDocument slug="termos-de-servico" contentHtml={sampleFragment} />)

    screen.getByRole('button', { name: 'Voltar' }).click()

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
