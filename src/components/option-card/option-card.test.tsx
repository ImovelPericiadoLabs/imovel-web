import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OptionCard from '@/components/option-card/option-card.tsx'
import { Users } from 'lucide-react'

// Mock do ícone para não depender da implementação real
vi.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-mock" />,
}))

// --- Função Setup ---
// Helper para renderizar o componente com props padrão e mocks
const setup = (props: Partial<React.ComponentProps<typeof OptionCard>> = {}) => {
  const onClickMock = vi.fn()

  const defaultProps = {
    icon: Users,
    title: 'Título de Teste',
    subtitle: 'Subtítulo de Teste',
    onClick: onClickMock,
    isSelected: false,
  }

  render(<OptionCard {...defaultProps} {...props} />)

  return {
    card: screen.getByText('Título de Teste').closest('div')!,
    onClickMock,
  }
}

describe('OptionCard', () => {
  it('should render title, subtitle, and icon correctly', () => {
    setup()
    expect(screen.getByText('Título de Teste')).toBeInTheDocument()
    expect(screen.getByText('Subtítulo de Teste')).toBeInTheDocument()
    expect(screen.getByTestId('icon-mock')).toBeInTheDocument()
  })

  it('should call onClick when the card is clicked', () => {
    const { card, onClickMock } = setup()

    fireEvent.click(card)

    expect(onClickMock).toHaveBeenCalledTimes(1)
  })

  it('should apply default styles when isSelected is false', () => {
    const { card } = setup({ isSelected: false })

    expect(card).toHaveClass('border-[#E7E7E7]')
    expect(card).not.toHaveClass('border-primary')
    expect(card).not.toHaveClass('ring-2')
  })

  it('should apply selected styles when isSelected is true', () => {
    const { card } = setup({ isSelected: true })

    expect(card).toHaveClass('border-primary')
    expect(card).toHaveClass('ring-2')
    expect(card).toHaveClass('ring-primary/20')
  })
})