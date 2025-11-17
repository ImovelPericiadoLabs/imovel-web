import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import ConsultProperty from './consult-property'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('react', async (importOriginal) => {
  const actualReact = await importOriginal<typeof import('react')>()
  return {
    ...actualReact,
    Activity: ({ mode, children }: { mode: string; children: React.ReactNode }) => {
      if (mode === 'visible') {
        return <div data-testid="activity-visible">{children}</div>
      }
      return null
    },
  }
})

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: (schema: object) => schema,
}))

vi.mock('@/components/progress-bar', () => ({
  default: ({ value }: { value: number }) => <div data-testid="progress-bar" data-value={value} />,
}))

vi.mock('lucide-react', () => ({
  ChevronLeft: (props: ComponentProps<'div'>) => <div data-testid="chevron-left" {...props} />,
}))

vi.mock('@/sections/consult-property/steps', async () => {
  const rhf = await vi.importActual<typeof import('react-hook-form')>('react-hook-form')

  const MockStep = ({ testId, name }: { testId: string; name: string }) => {
    const { handleNextStep } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid={testId}>
        {name}
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  const MockConfirmationStep = () => {
    const { handleNextStep, setHasDocument } = rhf.useFormContext() as FormContextWithSteps
    return (
      <div data-testid="document-confirmation-step">
        DocumentConfirmationStep
        <button onClick={() => setHasDocument(true)}>Set Has Document</button>
        <button onClick={handleNextStep}>Next Step</button>
      </div>
    )
  }

  return {
    AddressStep: () => <MockStep testId="address-step" name="AddressStep" />,
    DocumentConfirmationStep: () => <MockConfirmationStep />,
    DocumentTypeStep: () => <MockStep testId="document-type-step" name="DocumentTypeStep" />,
    SendDocumentStep: () => <MockStep testId="send-document-step" name="SendDocumentStep" />,
    SummaryStep: () => <MockStep testId="summary-step" name="SummaryStep" />,
    PaymentStep: () => <MockStep testId="payment-step" name="PaymentStep" />,
  }
})

describe('ConsultProperty', () => {
  const steps = [
    { step: 1, testId: 'address-step' },
    { step: 2, testId: 'document-confirmation-step' },
    { step: 3, testId: 'document-type-step' },
    { step: 4, testId: 'send-document-step' },
    { step: 5, testId: 'summary-step' },
    { step: 6, testId: 'payment-step' },
  ]

  const navigateToStep = async (targetStep: number) => {
    for (let i = 1; i < targetStep; i++) {
      const nextButtons = screen.getAllByRole('button', { name: /next step/i })
      fireEvent.click(nextButtons[0])
      const nextStepData = steps.find((s) => s.step === i + 1)
      if (nextStepData) {
        await screen.findByTestId(nextStepData.testId)
      }
    }
  }

  beforeEach(() => {
    render(<ConsultProperty />)
  })

  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })

  it('should render the initial step correctly', () => {
    expect(screen.getByRole('heading', { name: /consultar imóvel/i })).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/de/)).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByTestId('progress-bar')).toHaveAttribute('data-value', String((1 / 6) * 100))
  })

  it('should display the AddressStep on initial render and hide other steps', () => {
    expect(screen.getByTestId('address-step')).toBeInTheDocument()
    expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
  })

  it('should call router.push and not decrement step when back is clicked on the first step', () => {
    fireEvent.click(screen.getByTestId('chevron-left'))
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should advance to the next step when the next action is triggered', async () => {
    fireEvent.click(screen.getByRole('button', { name: /next step/i }))
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByTestId('progress-bar')).toHaveAttribute(
        'data-value',
        String((2 / 6) * 100),
      )
      expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()
      expect(screen.queryByTestId('address-step')).not.toBeInTheDocument()
    })
  })

  it('should navigate back to the previous step when back is clicked on a subsequent step', async () => {
    await navigateToStep(2)
    fireEvent.click(screen.getByTestId('chevron-left'))
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByTestId('address-step')).toBeInTheDocument()
      expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
    })
  })

  it('should not advance past the final step', async () => {
    await navigateToStep(6)
    expect(screen.getByTestId('payment-step')).toBeInTheDocument()
    expect(screen.getAllByText('6').length).toBe(2)

    fireEvent.click(screen.getByRole('button', { name: /next step/i }))
    await waitFor(() => {
      expect(screen.getByTestId('payment-step')).toBeInTheDocument()
      expect(screen.getAllByText('6').length).toBe(2)
    })
  })

  describe('Step visibility validation', () => {
    for (const currentStep of steps) {
      it(`should only display ${currentStep.testId} when on step ${currentStep.step}`, async () => {
        await navigateToStep(currentStep.step)
        await screen.findByTestId(currentStep.testId)

        steps.forEach((stepToCheck) => {
          if (stepToCheck.testId === currentStep.testId) {
            expect(screen.getByTestId(stepToCheck.testId)).toBeInTheDocument()
          } else {
            expect(screen.queryByTestId(stepToCheck.testId)).not.toBeInTheDocument()
          }
        })
      })
    }
  })

  describe('handleGoBack', () => {
    const navigateToStep = async (targetStep: number) => {
      const steps = [
        { step: 1, testId: 'address-step' },
        { step: 2, testId: 'document-confirmation-step' },
        { step: 3, testId: 'document-type-step' },
        { step: 4, testId: 'send-document-step' },
        { step: 5, testId: 'summary-step' },
        { step: 6, testId: 'payment-step' },
      ]
      for (let i = 1; i < targetStep; i++) {
        const nextButtons = screen.getAllByRole('button', { name: /next step/i })
        fireEvent.click(nextButtons[0])
        const nextStepData = steps.find((s) => s.step === i + 1)
        if (nextStepData) {
          await screen.findByTestId(nextStepData.testId)
        }
      }
    }

    it('should call router.push when on the first step', () => {
      fireEvent.click(screen.getByTestId('chevron-left'))
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should go back normally from a step with no special logic (e.g., step 3 to 2)', async () => {
      await navigateToStep(3)
      await screen.findByTestId('document-type-step')

      fireEvent.click(screen.getByTestId('chevron-left'))

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()
      })
    })

    it('should jump from step 5 back to step 2 when hasDocument is false', async () => {
      await navigateToStep(5)
      await screen.findByTestId('summary-step')

      fireEvent.click(screen.getByTestId('chevron-left'))

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByTestId('document-confirmation-step')).toBeInTheDocument()
      })
    })

    it('should go back normally from step 5 to step 4 when hasDocument is true', async () => {
      await navigateToStep(2)
      await screen.findByTestId('document-confirmation-step')
      fireEvent.click(screen.getByRole('button', { name: /set has document/i }))

      fireEvent.click(screen.getByRole('button', { name: /next step/i }))
      await screen.findByTestId('document-type-step')

      fireEvent.click(screen.getByRole('button', { name: /next step/i }))
      await screen.findByTestId('send-document-step')

      fireEvent.click(screen.getByRole('button', { name: /next step/i }))
      await screen.findByTestId('summary-step')

      fireEvent.click(screen.getByTestId('chevron-left'))

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument()
        expect(screen.getByTestId('send-document-step')).toBeInTheDocument()
      })
    })
  })
})
