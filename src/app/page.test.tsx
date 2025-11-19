import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from './page'
import { redirect } from 'next/navigation'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('Home', () => {
  it('should call redirect with the correct path', () => {
    render(<Home />)
    expect(redirect).toHaveBeenCalledWith('/consultar-imovel')
  })
})
