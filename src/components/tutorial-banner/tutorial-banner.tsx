'use client'

import { PlayCircle } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { YOUTUBE_TUTORIALS_URL } from '@/constants/onboarding'
import { trackGtmEvent } from '@/utils/analytics/gtm'

type TutorialBannerProps = {
  compact?: boolean
  className?: string
}

export function TutorialBanner({ compact = false, className }: TutorialBannerProps) {
  return (
    <a
      href={YOUTUBE_TUTORIALS_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackGtmEvent('tutorial_banner_click', {
          event_category: 'engagement',
          event_label: 'youtube_tutorials',
          event_description: 'Usuário abriu tutoriais do sistema no YouTube.',
        })
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-3 py-3 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/[0.1] sm:px-4',
        compact && 'rounded-xl px-3 py-2.5',
        className,
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary',
          compact ? 'size-9' : 'size-10 sm:size-11',
        )}
        aria-hidden
      >
        <PlayCircle className={cn(compact ? 'size-5' : 'size-5 sm:size-6')} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block font-bold leading-snug text-dark',
            compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-[15px]',
          )}
        >
          Para tutoriais do sistema
        </span>
        <span
          className={cn(
            'mt-0.5 block leading-snug text-gray-600',
            compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-[13px]',
          )}
        >
          Vídeos passo a passo no YouTube
        </span>
      </span>
    </a>
  )
}
