import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import TrafficLightModal from './traffic-light-modal'

vi.mock('@/components/modal', () => {
  type ModalProps = {
    title: string
    content: ReactNode
    children: ReactNode
  }

  const MockedModal = ({ title, content, children }: ModalProps) => (
    <div data-testid="modal">
      <h1 data-testid="modal-title">{title}</h1>
      <div data-testid="modal-content">{content}</div>
      <div data-testid="modal-children">{children}</div>
    </div>
  )

  return { default: MockedModal }
})

describe('TrafficLightModal', () => {
  it('should render the modal with correct title', () => {
    const { getByTestId } = render(<TrafficLightModal>child</TrafficLightModal>)
    expect(getByTestId('modal-title').textContent).toBe('Como funciona?')
  })

  it('should render children', () => {
    const { getByTestId } = render(
      <TrafficLightModal>
        <span data-testid="inner-child">Test</span>
      </TrafficLightModal>,
    )

    expect(getByTestId('inner-child')).toBeInTheDocument()
  })

  it('should render all explanation titles', () => {
    const { getByText } = render(<TrafficLightModal>child</TrafficLightModal>)

    expect(getByText('Impeditivo de compra e venda')).toBeInTheDocument()
    expect(getByText('Irregularidades encontradas')).toBeInTheDocument()
    expect(getByText('Tudo Certo!')).toBeInTheDocument()
  })

  it('should render all explanation descriptions', () => {
    const { getByText } = render(<TrafficLightModal>child</TrafficLightModal>)

    expect(getByText('Pendência detectada. Necessária regularização imediata.')).toBeInTheDocument()

    expect(getByText('Existem inconsistências que precisam ser verificadas.')).toBeInTheDocument()

    expect(getByText('Sem problemas. Pode seguir com a operação.')).toBeInTheDocument()
  })

  it('should render the hr separators', () => {
    const { container } = render(<TrafficLightModal>child</TrafficLightModal>)

    const separators = container.querySelectorAll('hr.border-box')
    expect(separators.length).toBe(4)
  })

  it('should render small colored circles for each explanation', () => {
    const { container } = render(<TrafficLightModal>child</TrafficLightModal>)

    expect(container.querySelector('.bg-red-600.size-2')).toBeInTheDocument()
    expect(container.querySelector('.bg-yellow-300.size-2')).toBeInTheDocument()
    expect(container.querySelector('.bg-green-500.size-2')).toBeInTheDocument()
  })
})
