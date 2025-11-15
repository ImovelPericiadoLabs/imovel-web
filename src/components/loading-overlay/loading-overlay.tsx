'use client'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export default function LoadingOverlay({
  isLoading,
  message = 'Carregando...',
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-20">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="35" className="stroke-secondary" strokeWidth="6" />
          </svg>

          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            viewBox="0 0 80 80"
            fill="none"
            style={{
              animationDuration: '1.2s',
              animationTimingFunction: 'linear',
            }}
          >
            <path
              d="M 40 5 A 35 35 0 0 1 65 65"
              className="stroke-primary"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="text-sm font-normal leading-6 text-center animate-pulse-text">{message}</p>
      </div>
    </div>
  )
}
