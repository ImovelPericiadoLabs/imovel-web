import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Badge from '.'

describe('Badge', () => {
  it('should render children', () => {
    const { getByText } = render(<Badge>Test Badge</Badge>)
    expect(getByText('Test Badge')).toBeInTheDocument()
  })

  it('should apply default variants', () => {
    const { getByText } = render(<Badge>Default Badge</Badge>)
    expect(getByText('Default Badge').className).toContain(
      'text-[0.75rem] px-3 py-1 rounded-[5rem]',
    )
    expect(getByText('Default Badge').className).toContain('border-primary text-primary')
  })

  it('should apply size sm', () => {
    const { getByText } = render(<Badge size="sm">Small Badge</Badge>)
    expect(getByText('Small Badge').className).toContain(
      'text-[0.625rem] px-[0.5rem] py-[0.125rem] rounded-[0.625rem]',
    )
  })

  it('should apply size md', () => {
    const { getByText } = render(<Badge size="md">Medium Badge</Badge>)
    expect(getByText('Medium Badge').className).toContain('text-[0.75rem] px-3 py-1 rounded-[5rem]')
  })

  it('should apply size lg', () => {
    const { getByText } = render(<Badge size="lg">Large Badge</Badge>)
    expect(getByText('Large Badge').className).toContain(
      'text-[0.875rem] px-[1rem] py-[0.375rem] rounded-[1rem]',
    )
  })

  it('should apply size xl', () => {
    const { getByText } = render(<Badge size="xl">Extra Large Badge</Badge>)
    expect(getByText('Extra Large Badge').className).toContain(
      'text-[1rem] px-[1.25rem] py-[0.5rem] rounded-[1.25rem]',
    )
  })

  it('should apply variant success', () => {
    const { getByText } = render(<Badge variant="success">Success Badge</Badge>)
    expect(getByText('Success Badge').className).toContain('border-[#04A13A] text-[#04A13A]')
  })

  it('should apply variant info', () => {
    const { getByText } = render(<Badge variant="info">Info Badge</Badge>)
    expect(getByText('Info Badge').className).toContain('border-primary text-primary')
  })

  it('should apply variant warning', () => {
    const { getByText } = render(<Badge variant="warning">Warning Badge</Badge>)
    expect(getByText('Warning Badge').className).toContain('text-[#FF9500] border-[#FF9500]')
  })

  it('should apply variant danger', () => {
    const { getByText } = render(<Badge variant="danger">Danger Badge</Badge>)
    expect(getByText('Danger Badge').className).toContain('border-[#FF3B30] text-[#FF3B30]')
  })

  it('should merge custom className', () => {
    const { getByText } = render(<Badge className="custom-class">Custom Badge</Badge>)
    expect(getByText('Custom Badge').className).toContain('custom-class')
  })
})
