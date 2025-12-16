import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckCircle } from 'lucide-react'
import Alert from './alert'

describe('Alert Component', () => {
  it('should render the message', () => {
    render(<Alert message="Hello world" />)
    expect(screen.getByTestId('alert-message')).toHaveTextContent('Hello world')
  })

  it('should render default variant if none is provided', () => {
    render(<Alert message="Default alert" />)

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('bg-gray-50')
    expect(alert.className).toContain('text-gray-700')
  })

  it('should render success variant styles', () => {
    render(<Alert variant="success" message="Success msg" />)

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('bg-green-50')
    expect(alert.className).toContain('text-green-700')
  })

  it('should render error variant styles', () => {
    render(<Alert variant="error" message="Error msg" />)

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('bg-red-50')
    expect(alert.className).toContain('text-red-700')
  })

  it('should render warning variant styles', () => {
    render(<Alert variant="warning" message="Warning msg" />)

    const alert = screen.getByTestId('alert')
    expect(alert.className).toContain('bg-yellow-50')
    expect(alert.className).toContain('text-yellow-700')
  })

  it('should override icon when custom icon is passed', () => {
    render(<Alert message="Custom" icon={<CheckCircle data-testid="custom-icon" />} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('should render the default icon when no icon is provided', () => {
    render(<Alert message="Default icon test" />)

    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
  })
})
