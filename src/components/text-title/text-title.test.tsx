import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TextTitle from '@/components/text-title'

describe('TextTitle', () => {
  it('should render children text correctly', () => {
    render(<TextTitle>Title Text</TextTitle>)
    expect(screen.getByText('Title Text')).toBeInTheDocument()
  })

  it('should render as an h1 element', () => {
    render(<TextTitle>Heading</TextTitle>)
    const heading = screen.getByText('Heading')
    expect(heading.tagName.toLowerCase()).toBe('h1')
  })

  it('should apply default classes', () => {
    render(<TextTitle>Default</TextTitle>)
    const element = screen.getByText('Default')
    expect(element.className).toContain('text-lg')
    expect(element.className).toContain('font-bold')
    expect(element.className).toContain('text-white')
    expect(element.className).toContain('leading-6')
  })

  it('should merge custom className with default classes', () => {
    render(<TextTitle className="custom-class">Custom</TextTitle>)
    const element = screen.getByText('Custom')
    expect(element.className).toContain('custom-class')
    expect(element.className).toContain('text-lg')
  })
})
