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

  return {
    AddressStep: () => <MockStep testId="address-step" name="AddressStep" />,
    DocumentConfirmationStep: () => (
      <MockStep testId="document-confirmation-step" name="DocumentConfirmationStep" />
    ),
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
    expect(screen.queryByTestId('document-type-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('send-document-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('summary-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('payment-step')).not.toBeInTheDocument()
  })

  it('should call router.push and not decrement step when back is clicked on the first step', () => {
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByTestId('address-step')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('chevron-left'))

    expect(mockPush).toHaveBeenCalledWith('/')

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should advance to the next step when the next action is triggered', async () => {
    const nextButton = screen.getByRole('button', { name: /next step/i })
    fireEvent.click(nextButton)

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
    fireEvent.click(screen.getByRole('button', { name: /next step/i }))
    await screen.findByTestId('document-confirmation-step')

    const backButton = screen.getByTestId('chevron-left')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByTestId('address-step')).toBeInTheDocument()
      expect(screen.queryByTestId('document-confirmation-step')).not.toBeInTheDocument()
    })
  })

  it('should not advance past the final step', async () => {
    for (let i = 0; i < steps.length - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next step/i }))
      await screen.findByTestId(steps[i + 1].testId)
    }

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
        for (let j = 0; j < currentStep.step - 1; j++) {
          fireEvent.click(screen.getByRole('button', { name: /next step/i }))
          await screen.findByTestId(steps[j + 1].testId)
        }

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
})
