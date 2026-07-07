import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { SavedCardsPage } from './card-payment-page'

vi.mock('@/hooks/use-consult-price', () => ({
  useConsultDynamicPrice: () => ({ price: 59, isLoading: false }),
}))

function formWrapper() {
  function W({ children }: { children: React.ReactNode }) {
    const methods = useForm({
      defaultValues: {
        address: 'Rua Teste',
        registrationNumber: '',
        allotment: '',
        block: '',
        lot: '',
      },
    })
    return <FormProvider {...methods}>{children}</FormProvider>
  }
  return W
}

describe('SavedCardsPage', () => {
  const mockOnAddNewCard = vi.fn()

  const defaultProps = {
    onAddNewCard: mockOnAddNewCard,
  }

  it('deve renderizar a lista de cartões inicial corretamente', () => {
    render(<SavedCardsPage {...defaultProps} />, { wrapper: formWrapper() })

    expect(screen.getByText(/Mastercard\s*\*{4}1234/)).toBeInTheDocument()
    expect(screen.getByText(/Vence 11\/29/i)).toBeInTheDocument()

    expect(screen.getByText(/Visa\s*\*{4}7536/)).toBeInTheDocument()
    expect(screen.getByText(/Vence 11\/28/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Novo cartão/i })).toBeInTheDocument()
  })

  it('deve renderizar o ícone correto para cada bandeira', () => {
    render(<SavedCardsPage {...defaultProps} />, { wrapper: formWrapper() })

    const mastercardContainer = screen.getByText(/Mastercard\s*\*{4}1234/).parentElement?.parentElement
    expect(mastercardContainer?.innerHTML).toContain('bg-[#EB001B]')
    expect(mastercardContainer?.innerHTML).toContain('bg-[#F79E1B]')

    const visaContainer = screen.getByText(/Visa\s*\*{4}7536/).parentElement?.parentElement
    const visaImg = screen.getByAltText('Visa')
    expect(visaImg).toBeInTheDocument()
    expect(visaImg.getAttribute('src') || '').toContain('visa.webp')
  })

  it('deve indicar visualmente o cartão selecionado (Mastercard por padrão)', () => {
    render(<SavedCardsPage {...defaultProps} />, { wrapper: formWrapper() })

    const mastercardShell = screen.getByTestId('saved-card-1')
    const visaShell = screen.getByTestId('saved-card-2')

    expect(mastercardShell).toHaveClass('border-primary')
    expect(visaShell).toHaveClass('border-gray-200')

    const checksInMaster = within(mastercardShell).getAllByTestId('icon-Check')
    expect(checksInMaster.length).toBeGreaterThanOrEqual(1)
  })

  it('deve alternar a seleção ao clicar em outro cartão', () => {
    render(<SavedCardsPage {...defaultProps} />, { wrapper: formWrapper() })

    const visaShell = screen.getByTestId('saved-card-2')
    const visaRow = within(visaShell).getAllByRole('button')[0]
    fireEvent.click(visaRow)

    expect(visaShell).toHaveClass('border-primary')

    const mastercardShell = screen.getByTestId('saved-card-1')
    expect(mastercardShell).toHaveClass('border-gray-200')

    const check = within(visaShell).getAllByTestId('icon-Check')[0]
    expect(visaShell).toContainElement(check)
  })

  it('deve chamar onAddNewCard ao clicar no botão de novo cartão', () => {
    render(<SavedCardsPage {...defaultProps} />, { wrapper: formWrapper() })

    const addButton = screen.getByRole('button', { name: /Novo cartão/i })
    fireEvent.click(addButton)

    expect(mockOnAddNewCard).toHaveBeenCalledTimes(1)
  })
})