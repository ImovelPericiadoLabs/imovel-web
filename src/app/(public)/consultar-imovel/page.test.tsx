import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ConsultarImovelPage from './page'

vi.mock('@/sections/consult-property', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="consult-property" />),
}))

describe('ConsultarImovelPage', () => {
  it('should render ConsultProperty component', async () => {
    render(<ConsultarImovelPage />)
    await waitFor(() => {
      expect(screen.getByTestId('consult-property')).toBeInTheDocument()
    })
  })
})
