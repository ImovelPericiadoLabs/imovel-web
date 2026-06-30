import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomSheet from './bottom-sheet'

describe('BottomSheet', () => {
  it('should render children correctly', () => {
    render(
      <BottomSheet isOpen={true}>
        <div data-testid="content">Content</div>
      </BottomSheet>,
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should apply visible classes when open', () => {
    render(
      <BottomSheet isOpen={true}>
        <div>Test</div>
      </BottomSheet>,
    )

    const sheet = screen.getByTestId('bottom-sheet')

    expect(sheet).toHaveStyle({ transform: 'translateY(0)', opacity: '1' })
  })

  it('should apply hidden classes when closed', () => {
    render(
      <BottomSheet isOpen={false}>
        <div>Test</div>
      </BottomSheet>,
    )

    const sheet = screen.getByTestId('bottom-sheet')

    expect(sheet).toHaveStyle({ transform: 'translateY(100%)', opacity: '0' })
  })

  it('should show overlay when open', () => {
    render(
      <BottomSheet isOpen={true}>
        <div>Test</div>
      </BottomSheet>,
    )

    expect(screen.getByTestId('overlay')).toBeInTheDocument()
  })

  it('should not show overlay when closed', () => {
    render(
      <BottomSheet isOpen={false}>
        <div>Test</div>
      </BottomSheet>,
    )

    expect(screen.queryByTestId('overlay')).toBeNull()
  })

  it('should call onClose when clicking overlay', () => {
    const onClose = vi.fn()

    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <div>Test</div>
      </BottomSheet>,
    )

    fireEvent.click(screen.getByTestId('overlay'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
