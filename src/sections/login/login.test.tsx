import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import Login from './login'

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: (schema: any) => schema,
}))

vi.mock('@/sections/login/validations', () => ({
  validations: {},
  FormTypes: {},
}))

vi.mock('./steps/insert-step', () => ({
  InsertStep: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="insert-step">
      <button onClick={onNext}>Next Step</button>
    </div>
  ),
}))

vi.mock('./steps/verify-step', () => ({
  VerifyCodeStep: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="verify-step">
      <button onClick={onBack}>Back Step</button>
    </div>
  ),
}))

describe('Login Flow', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
    render(<Login />)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render ONLY the email step initially', () => {
    const insertStep = screen.getByTestId('insert-step')
    const verifyStep = screen.getByTestId('verify-step')

    expect(insertStep).toBeVisible()
    expect(verifyStep).not.toBeVisible()
  })

  it('should switch to code step when Next is clicked', () => {
    fireEvent.click(screen.getByText('Next Step'))

    const insertStep = screen.getByTestId('insert-step')
    const verifyStep = screen.getByTestId('verify-step')

    expect(verifyStep).toBeVisible()
    expect(insertStep).not.toBeVisible()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('should return to email step when Back is clicked', () => {
    fireEvent.click(screen.getByText('Next Step'))
    expect(screen.getByTestId('verify-step')).toBeVisible()

    fireEvent.click(screen.getByText('Back Step'))

    const insertStep = screen.getByTestId('insert-step')
    const verifyStep = screen.getByTestId('verify-step')

    expect(insertStep).toBeVisible()
    expect(verifyStep).not.toBeVisible()
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})