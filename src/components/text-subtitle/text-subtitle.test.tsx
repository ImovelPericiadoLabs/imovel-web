import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TextSubtitle from './text-subtitle'

describe('TextSubtitle', () => {
  it('should render children text correctly', () => {
    render(<TextSubtitle>Subtitle Text</TextSubtitle>)
    expect(screen.getByText('Subtitle Text')).toBeInTheDocument()
  })

  it('should render as an h1 element', () => {
    render(<TextSubtitle>Heading</TextSubtitle>)
    const heading = screen.getByText('Heading')
    expect(heading.tagName.toLowerCase()).toBe('h1')
  })

  it('should apply default classes', () => {
    render(<TextSubtitle>Default</TextSubtitle>)
    const element = screen.getByText('Default')
    expect(element.className).toContain('text-sm')
    expect(element.className).toContain('font-normal')
    expect(element.className).toContain('text-white')
    expect(element.className).toContain('leading-4')
  })

  it('should merge custom className with default classes', () => {
    render(<TextSubtitle className="custom-class">Custom</TextSubtitle>)
    const element = screen.getByText('Custom')
    expect(element.className).toContain('custom-class')
    expect(element.className).toContain('text-sm')
  })
})
