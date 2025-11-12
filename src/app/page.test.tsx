import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from './page'

describe('Home', () => {
  it('should render the heading with text Home', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument()
  })
})
