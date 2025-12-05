import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConsultarImovelPage from './page'

vi.mock('@/sections/login', () => ({
  default: () => <div data-testid="login-component">Login Component</div>,
}))

describe('ConsultarImovelPage', () => {
  it('should render the Login component', () => {
    render(<ConsultarImovelPage />)
    expect(screen.getByTestId('login-component')).toBeVisible()
  })
})