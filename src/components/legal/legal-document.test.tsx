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

const fullHtml =
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Termos</title></head><body><p>Corpo do documento</p></body></html>'

describe('LegalDocument', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockPush.mockReset()
  })

  it('renderiza iframe com HTML completo da API (srcDoc)', () => {
    const { container } = render(
      <LegalDocument slug="termos-de-servico" fullDocumentHtml={fullHtml} />,
    )

    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
    expect(iframe).toHaveAttribute('srcDoc', fullHtml)
    expect(iframe).toHaveAttribute('title', 'Termos de Serviço')
    expect(screen.getByRole('heading', { name: 'Termos de Serviço' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
  })

  it('volta à página anterior ao clicar em Voltar', () => {
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    })

    render(<LegalDocument slug="termos-de-servico" fullDocumentHtml={fullHtml} />)

    screen.getByRole('button', { name: 'Voltar' }).click()

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })
})
