'use client'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: number
}

export default function LoadingOverlay({
  isLoading,
  message = 'Carregando...',
  progress,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  const radius = 35
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset =
    progress !== undefined ? circumference - (progress / 100) * circumference : 0

  const showProgress = typeof progress === 'number'

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-20">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r={radius} className="stroke-secondary" strokeWidth="6" />
          </svg>

          {showProgress ? (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                className="stroke-primary"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.2s linear' }}
              />
            </svg>
          ) : (
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
          )}

          {showProgress && (
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {progress}%
            </span>
          )}
        </div>

        <p className="text-sm font-normal leading-6 text-center animate-pulse-text">{message}</p>
      </div>
    </div>
  )
}
