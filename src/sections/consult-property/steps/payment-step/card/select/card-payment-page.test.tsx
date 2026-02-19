import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SavedCardsPage } from './card-payment-page'

vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
}))

describe('SavedCardsPage', () => {
  const mockOnAddNewCard = vi.fn()

  const defaultProps = {
    onAddNewCard: mockOnAddNewCard,
  }

  it('deve renderizar a lista de cartões inicial corretamente', () => {
    render(<SavedCardsPage {...defaultProps} />)

    expect(screen.getByText(/Mastercard final \*\*\*\*1234/i)).toBeInTheDocument()
    expect(screen.getByText(/Vence 11\/29/i)).toBeInTheDocument()

    expect(screen.getByText(/Visa final \*\*\*\*7536/i)).toBeInTheDocument()
    expect(screen.getByText(/Vence 11\/28/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Novo cartão/i })).toBeInTheDocument()
  })

  it('deve renderizar o ícone correto para cada bandeira', () => {
    render(<SavedCardsPage {...defaultProps} />)

    const mastercardContainer = screen.getByText(/Mastercard final/i).parentElement?.parentElement
    expect(mastercardContainer?.innerHTML).toContain('bg-[#EB001B]')
    expect(mastercardContainer?.innerHTML).toContain('bg-[#F79E1B]')

    const visaContainer = screen.getByText(/Visa final/i).parentElement?.parentElement
    const visaImg = screen.getByAltText('Visa')
    expect(visaImg).toBeInTheDocument()
    expect(visaImg).toHaveAttribute('src', '/images/visa.webp')
  })

  it('deve indicar visualmente o cartão selecionado (Mastercard por padrão)', () => {
    render(<SavedCardsPage {...defaultProps} />)

    const cards = screen.getAllByText(/final \*\*\*\*/i)
    const mastercardItem = cards[0].closest('div.cursor-pointer')
    const visaItem = cards[1].closest('div.cursor-pointer')

    expect(mastercardItem).toHaveClass('border-[var(--color-primary)]')
    expect(visaItem).toHaveClass('border-gray-200')

    const checks = screen.getAllByTestId('check-icon')
    expect(checks).toHaveLength(1)
    expect(mastercardItem).toContainElement(checks[0])
  })

  it('deve alternar a seleção ao clicar em outro cartão', () => {
    render(<SavedCardsPage {...defaultProps} />)

    const visaText = screen.getByText(/Visa final \*\*\*\*7536/i)
    const visaItem = visaText.closest('div.cursor-pointer')

    fireEvent.click(visaItem!)

    expect(visaItem).toHaveClass('border-[var(--color-primary)]')

    const mastercardText = screen.getByText(/Mastercard final \*\*\*\*1234/i)
    const mastercardItem = mastercardText.closest('div.cursor-pointer')
    expect(mastercardItem).toHaveClass('border-gray-200')

    const check = screen.getByTestId('check-icon')
    expect(visaItem).toContainElement(check)
  })

  it('deve chamar onAddNewCard ao clicar no botão de novo cartão', () => {
    render(<SavedCardsPage {...defaultProps} />)

    const addButton = screen.getByRole('button', { name: /Novo cartão/i })
    fireEvent.click(addButton)

    expect(mockOnAddNewCard).toHaveBeenCalledTimes(1)
  })
})