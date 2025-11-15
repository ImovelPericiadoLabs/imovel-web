import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import OptionCard from '@/components/option-card/option-card.tsx'
import { Users } from 'lucide-react'

vi.mock('lucide-react', () => ({
  Users: () => <span data-testid="icon-mock" />,
}))

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
    card: screen.getByTestId('option-card'),
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
})
