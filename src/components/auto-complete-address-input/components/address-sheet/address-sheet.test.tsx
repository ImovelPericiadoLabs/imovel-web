import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AddressSheet from './address-sheet'

describe('AddressSheet', () => {
  it('should render children correctly', () => {
    render(
      <AddressSheet isOpen={true}>
        <div data-testid="child-element">Content</div>
      </AddressSheet>,
    )

    expect(screen.getByTestId('child-element')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should apply open classes when isOpen is true', () => {
    const { container } = render(
      <AddressSheet isOpen={true}>
        <div />
      </AddressSheet>,
    )

    const wrapper = container.firstChild as HTMLElement

    expect(wrapper.className).toContain('translate-y-0')
    expect(wrapper.className).toContain('opacity-100')
  })

  it('should apply closed classes when isOpen is false', () => {
    const { container } = render(
      <AddressSheet isOpen={false}>
        <div />
      </AddressSheet>,
    )

    const wrapper = container.firstChild as HTMLElement

    expect(wrapper.className).toContain('translate-y-full')
    expect(wrapper.className).toContain('opacity-0')
  })

  it('should always have base classes', () => {
    const { container } = render(
      <AddressSheet isOpen={true}>
        <div />
      </AddressSheet>,
    )

    const wrapper = container.firstChild as HTMLElement

    expect(wrapper.className).toContain('fixed')
    expect(wrapper.className).toContain('bottom-0')
    expect(wrapper.className).toContain('rounded-t-[1.75rem]')
    expect(wrapper.className).toContain('transition-all')
  })
})
