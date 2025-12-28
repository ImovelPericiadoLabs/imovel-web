import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ConsultarImovelPage from './page'

const mockPush = vi.fn()
const mockPrefetch = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch,
  }),
}))

vi.mock('next/image', () => ({
  default: ({ priority, ...props }: any) => <img {...props} data-priority={priority ? "true" : "false"} />,
}))

vi.mock('@/components/button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

describe('ConsultarImovelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(),
    })
  })

  const setVideoProperty = (video: HTMLVideoElement, prop: string, value: number) => {
    Object.defineProperty(video, prop, {
      writable: true,
      configurable: true,
      value,
    })
  }

  it('should render initial state correctly (muted and locked)', () => {
    render(<ConsultarImovelPage />)
    expect(screen.getByText('Ativar som')).toBeInTheDocument()
    const startButton = screen.getByRole('button', { name: /Começar/i })
    expect(startButton).toBeDisabled()
  })

  it('should unmute and play video when "Ativar som" is clicked', () => {
    const { container } = render(<ConsultarImovelPage />)
    const unmuteButton = screen.getByText('Ativar som').closest('button')!
    const video = container.querySelector('video') as HTMLVideoElement

    fireEvent.click(unmuteButton)

    expect(video.play).toHaveBeenCalled()
    expect(video.muted).toBe(false)
  })

  it('should unlock the button when video progress > 98%', () => {
    const { container } = render(<ConsultarImovelPage />)
    const video = container.querySelector('video') as HTMLVideoElement
    
    setVideoProperty(video, 'duration', 100)
    fireEvent.loadedMetadata(video)
    
    expect(screen.getByText('Começar (faltam 100s)')).toBeInTheDocument()

    setVideoProperty(video, 'currentTime', 99)
    fireEvent.timeUpdate(video)

    const startButton = screen.getByRole('button', { name: 'Começar' })
    expect(startButton).toBeEnabled()
    expect(startButton).not.toHaveTextContent('faltam')
  })

  it('should navigate to next page when unlocked and clicked', () => {
    const { container } = render(<ConsultarImovelPage />)
    const video = container.querySelector('video') as HTMLVideoElement
    
    setVideoProperty(video, 'duration', 100)
    fireEvent.loadedMetadata(video)
    
    setVideoProperty(video, 'currentTime', 99)
    fireEvent.timeUpdate(video)

    const startButton = screen.getByRole('button', { name: 'Começar' })
    fireEvent.click(startButton)

    expect(mockPush).toHaveBeenCalledWith('/consultar-imovel')
  })

  it('should not navigate if button is locked', () => {
    render(<ConsultarImovelPage />)
    const startButton = screen.getByRole('button', { name: /Começar/i })
    fireEvent.click(startButton)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should persist the unlocked state in localStorage', () => {
    const { container, unmount } = render(<ConsultarImovelPage />)
    const video = container.querySelector('video') as HTMLVideoElement
    
    setVideoProperty(video, 'duration', 100)
    fireEvent.loadedMetadata(video)
    
    setVideoProperty(video, 'currentTime', 99)
    fireEvent.timeUpdate(video)

    expect(localStorage.getItem('vsl-unlocked')).toBe('true')
    
    unmount()
    
    render(<ConsultarImovelPage />)
    const startButton = screen.getByRole('button', { name: 'Começar' })
    expect(startButton).toBeEnabled()
    expect(startButton).not.toHaveTextContent('faltam')
  })
})