import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from './button'

vi.mock('@/utils/tailwind', () => ({
  cn: vi.fn((...classes: string[]) => classes.filter(Boolean).join(' ')),
}))

describe('Button', () => {
  it('should render the button with children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should apply default classes', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('cursor-pointer')
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('text-white')
    expect(button.className).toContain('rounded-full')
  })

  it('should merge custom className with default classes', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('custom-class')
    expect(button.className).toContain('bg-primary')
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
