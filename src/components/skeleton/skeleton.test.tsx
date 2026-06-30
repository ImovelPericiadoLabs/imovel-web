import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Skeleton from '.'

describe('Skeleton', () => {
  it('should render correctly', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />)
    expect(getByTestId('skeleton')).toBeInTheDocument()
  })

  it('should have default classes', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />)
    expect(getByTestId('skeleton')).toHaveClass('bg-neutral-500', 'animate-pulse')
  })

  it('should merge custom className with default classes', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" className="custom-class" />)
    expect(getByTestId('skeleton')).toHaveClass('bg-neutral-500', 'animate-pulse', 'custom-class')
  })

  it('should contain data-slot attribute', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton" />)
    expect(getByTestId('skeleton')).toHaveAttribute('data-slot', 'skeleton')
  })
})
