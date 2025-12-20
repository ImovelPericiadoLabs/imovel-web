import { vi, describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import React from 'react'

vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="icon-search" />,
  X: ({ onClick }: any) => <div data-testid="icon-clear" onClick={onClick} />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  CircleAlert: () => <div data-testid="icon-alert" />,
  MapPinX: () => <div data-testid="icon-map-pin-x" />,
}))

vi.mock('@/utils/tailwind', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}))

vi.mock('@/components/button', () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}))

vi.mock('@/components/input', () => ({
  default: React.forwardRef((props: any, ref: any) => (
    <input {...props} ref={ref} data-testid="base-input" />
  )),
}))

vi.mock('@/components/text-title', () => ({
  default: ({ children }: any) => <h1>{children}</h1>,
}))

vi.mock('../text-subtitle', () => ({
  default: ({ children }: any) => <h2>{children}</h2>,
}))

vi.mock('@/components/skeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}))

vi.mock('@/components/bottom-sheet', () => ({
  default: ({ isOpen, children, onClose }: any) =>
    isOpen ? (
      <div data-testid="bottom-sheet">
        <button onClick={onClose} data-testid="close-sheet">Close</button>
        {children}
      </div>
    ) : null,
}))

import AutoCompleteInput from './auto-complete-address-input'

describe('AutoCompleteInput', () => {
  const defaultProps = {
    onConfirm: vi.fn(),
    onSelectAddress: vi.fn().mockResolvedValue({ address: 'Rua Teste, 123', addressNumber: '123' }),
  }

  it('deve renderizar e atualizar o valor', () => {
    render(<AutoCompleteInput {...defaultProps} placeholder="Buscar..." />)
    const input = screen.getByTestId('base-input')
    fireEvent.change(input, { target: { value: 'Av Paulista' } })
    expect(input).toHaveValue('Av Paulista')
  })

  it('deve limpar o input e focar ao clicar no X', () => {
    render(<AutoCompleteInput {...defaultProps} />)
    const input = screen.getByTestId('base-input')
    fireEvent.change(input, { target: { value: 'Texto' } })
    fireEvent.click(screen.getByTestId('icon-clear'))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('deve exibir opções e confirmar o endereço', async () => {
    const options = [{ primary: 'Rua A', placeId: '123', value: '1' }]
    render(<AutoCompleteInput {...defaultProps} options={options} />)

    fireEvent.change(screen.getByTestId('base-input'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua A'))

    await waitFor(() => expect(screen.getByText('Confirmar este endereço?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Confirmar'))
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('Rua Teste, 123')
  })

  it('deve mostrar erro quando endereço não tem número e fechar', async () => {
    const mockNoNumber = vi.fn().mockResolvedValue({ address: 'Rua S/N', addressNumber: null })
    render(<AutoCompleteInput {...defaultProps} onSelectAddress={mockNoNumber} options={[{ primary: 'Rua A', placeId: '1' }]} />)

    fireEvent.change(screen.getByTestId('base-input'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua A'))

    const modalErro = await screen.findByText('Número do endereço obrigatório')
    const parentSheet = modalErro.closest('[data-testid="bottom-sheet"]') as HTMLElement

    const btn = within(parentSheet).getByText('Entendi')
    fireEvent.click(btn)

    expect(screen.queryByText('Número do endereço obrigatório')).not.toBeInTheDocument()
  })

  it('deve mostrar modal de "não encontrado" quando isDirty e fechar', async () => {
    render(<AutoCompleteInput {...defaultProps} options={[]} isDirty={true} />)
    fireEvent.change(screen.getByTestId('base-input'), { target: { value: 'Vazio' } })

    const modalNotFound = await screen.findByText('Não encontramos seu endereço')
    const parentSheet = modalNotFound.closest('[data-testid="bottom-sheet"]') as HTMLElement

    const btn = within(parentSheet).getByText('Entendi')
    fireEvent.click(btn)

    expect(screen.queryByText('Não encontramos seu endereço')).not.toBeInTheDocument()
  })

it('deve mostrar modal de "não encontrado" quando isDirty e fechar', async () => {
    render(<AutoCompleteInput {...defaultProps} options={[]} isDirty={true} />)
    
    const input = screen.getByTestId('base-input')
    fireEvent.change(input, { target: { value: 'Busca Sem Resultados' } })
    
    const title = await screen.findByText('Não encontramos seu endereço')
    
    const modal = title.closest('[data-testid="bottom-sheet"]')
    
    if (!modal) throw new Error('Modal não encontrado')

    const btn = within(modal as HTMLElement).getByText('Entendi')
    
    fireEvent.click(btn)
    
    await waitFor(() => {
      expect(screen.queryByText('Não encontramos seu endereço')).not.toBeInTheDocument()
    })
  })

  it('deve fechar modal de confirmação ao clicar em Mudar', async () => {
    render(<AutoCompleteInput {...defaultProps} options={[{ primary: 'Rua X', placeId: '1' }]} />)
    fireEvent.change(screen.getByTestId('base-input'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua X'))

    const mudarBtn = await screen.findByText('Mudar')
    fireEvent.click(mudarBtn)
    expect(screen.queryByText('Confirmar este endereço?')).not.toBeInTheDocument()
  })

  it('deve renderizar skeletons no carregamento inicial', () => {
    render(<AutoCompleteInput {...defaultProps} isLoading={true} />)
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
  })

  it('deve mostrar esqueletos no modal de confirmação se isLoadingAddress for true', async () => {
    render(<AutoCompleteInput {...defaultProps} isLoadingAddress={true} options={[{ primary: 'Rua X', placeId: '1' }]} />)

    fireEvent.change(screen.getByTestId('base-input'), { target: { value: 'Rua' } })
    fireEvent.click(screen.getByText('Rua X'))

    await waitFor(() => {
      const confirmSheet = screen.getByText('Confirmar este endereço?').closest('[data-testid="bottom-sheet"]')
      expect(within(confirmSheet as HTMLElement).getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })
  })
});