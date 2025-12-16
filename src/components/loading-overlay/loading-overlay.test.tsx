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
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('should display the default message', () => {
    render(<LoadingOverlay isLoading={true} />)
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('should display a custom message when provided', () => {
    render(<LoadingOverlay isLoading={true} message="Enviando..." />)
    expect(screen.getByText('Enviando...')).toBeInTheDocument()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
  })

  it('should render spinner when there is no progress', () => {
    const { container } = render(<LoadingOverlay isLoading={true} />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render progress circle when progress is provided', () => {
    const { container } = render(<LoadingOverlay isLoading={true} progress={45} />)
    const progressCircle = container.querySelector('circle[class*="stroke-primary"]')
    expect(progressCircle).toBeInTheDocument()
  })

  it('should show percentage text when progress is provided', () => {
    render(<LoadingOverlay isLoading={true} progress={72} />)
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('should not render spinner when progress is provided', () => {
    const { container } = render(<LoadingOverlay isLoading={true} progress={30} />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('should have correct strokeDashoffset calculation for progress', () => {
    const { container } = render(<LoadingOverlay isLoading={true} progress={50} />)

    const circle = container.querySelector('circle[class*="stroke-primary"]') as SVGCircleElement

    const radius = 35
    const circumference = 2 * Math.PI * radius
    const expectedOffset = circumference - (50 / 100) * circumference

    expect(circle.getAttribute('stroke-dashoffset')).toBe(String(expectedOffset))
  })
})
