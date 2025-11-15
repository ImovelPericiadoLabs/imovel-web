import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingOverlay from './loading-overlay'

describe('LoadingOverlay', () => {
  it('should not render when isLoading is false', () => {
    const { container } = render(<LoadingOverlay isLoading={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render the overlay when isLoading is true', () => {
    render(<LoadingOverlay isLoading={true} />)
    const overlay = screen.getByText('Carregando...').closest('div.fixed')
    expect(overlay).toBeInTheDocument()
  })

  it('should display the default message when isLoading is true and no message is provided', () => {
    render(<LoadingOverlay isLoading={true} />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('should display a custom message when one is provided', () => {
    const customMessage = 'Enviando seus dados...'
    render(<LoadingOverlay isLoading={true} message={customMessage} />)

    expect(screen.getByText(customMessage)).toBeInTheDocument()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
  })

  it('should render the spinner SVGs when loading', () => {
    const { container } = render(<LoadingOverlay isLoading={true} />)
    const svgs = container.querySelectorAll('svg')

    expect(svgs.length).toBe(2)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
