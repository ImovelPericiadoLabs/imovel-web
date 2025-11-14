import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Modal from './modal'

vi.mock('lucide-react', () => ({
  X: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="close-icon" {...props} />,
  ChevronLeft: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="back-icon" {...props} />,
}))

beforeEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Modal Component', () => {
  it('should render trigger and open modal on click (uncontrolled)', () => {
    render(
      <Modal content={<div data-testid="content">Modal Content</div>}>
        <button data-testid="trigger">Open</button>
      </Modal>,
    )

    expect(screen.getByTestId('trigger')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should open modal when open={true} (controlled)', () => {
    render(<Modal open content={<div data-testid="content">Modal Content</div>} />)
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should call onClose when clicking overlay in controlled mode', () => {
    const onCloseMock = vi.fn()

    render(<Modal open onClose={onCloseMock} content={<div>Modal Content</div>} />)

    const overlay = document.body.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(overlay)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('should close internally when clicking overlay in uncontrolled mode', () => {
    render(
      <Modal content={<div data-testid="content">Modal Content</div>}>
        <button data-testid="trigger">Open</button>
      </Modal>,
    )

    fireEvent.click(screen.getByTestId('trigger'))
    expect(screen.getByTestId('content')).toBeInTheDocument()

    const overlay = document.body.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(overlay)

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('should call onClose when clicking close button (controlled)', () => {
    const onCloseMock = vi.fn()

    render(<Modal open onClose={onCloseMock} content={<div>Modal Content</div>} />)

    const btn = screen.getByTestId('close-icon').parentElement as HTMLElement
    fireEvent.click(btn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('should apply body overflow hidden when open', () => {
    render(<Modal open content={<div>Modal Content</div>} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should remove body overflow when unmounted', () => {
    const { unmount } = render(<Modal open content={<div>Modal Content</div>} />)
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('Modal Component – Root and Early Returns', () => {
  //   it('should return only trigger when window is undefined (modalRoot=null)', () => {
  //     const originalWindow = globalThis.window
  //     vi.stubGlobal('window', undefined)

  //     const { container } = render(
  //       <Modal content={<div>modal</div>}>
  //         <button data-testid="trigger">Open</button>
  //       </Modal>,
  //     )

  //     expect(screen.getByTestId('trigger')).toBeInTheDocument()
  //     expect(container.querySelector('.fixed')).toBeNull()

  //     vi.stubGlobal('window', originalWindow)
  //   })

  it('should return trigger when isOpen=false in uncontrolled mode', () => {
    const { container } = render(
      <Modal content={<div>modal</div>}>
        <button data-testid="trigger">Open</button>
      </Modal>,
    )

    expect(screen.getByTestId('trigger')).toBeInTheDocument()
    expect(container.querySelector('.fixed')).toBeNull()
  })

  it('should return trigger when open={false} in controlled mode', () => {
    const { container } = render(
      <Modal open={false} content={<div>modal</div>}>
        <button data-testid="trigger">Open</button>
      </Modal>,
    )

    expect(screen.getByTestId('trigger')).toBeInTheDocument()
    expect(container.querySelector('.fixed')).toBeNull()
  })
})
