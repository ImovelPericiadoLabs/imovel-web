import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConsultarImovelPage from './page'

vi.mock('@/sections/vsl/vsl-page', () => ({
  default: () => <div data-testid="vsl-page">VSL</div>,
}))

describe('ConsultarImovelPage', () => {
  it('should render VslPage', () => {
    render(<ConsultarImovelPage />)
    expect(screen.getByTestId('vsl-page')).toBeInTheDocument()
  })
})
