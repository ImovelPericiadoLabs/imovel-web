'use client'

import Image from 'next/image'
import { PlayCircle } from 'lucide-react'
import { BRAND_LOGO_WITH_TEXT_SRC } from '@/constants/brand-logo'
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
        'group relative flex w-full min-h-[8.5rem] overflow-hidden rounded-2xl border border-primary/25 text-center shadow-sm transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-md sm:min-h-[9rem]',
        compact && 'min-h-[7.5rem] rounded-xl sm:min-h-[8rem]',
        className,
      )}
    >
      <picture className="pointer-events-none absolute inset-0" aria-hidden>
        <source media="(min-width: 640px)" srcSet="/images/tutorial-banner-bg-desktop.png" />
        <img
          src="/images/tutorial-banner-bg-mobile.png"
          alt=""
          className="size-full object-cover object-center"
        />
      </picture>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b1b3a]/92 via-[#0b1b3a]/55 to-[#142a5b]/35"
        aria-hidden
      />

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 px-4 py-4 sm:gap-2.5 sm:py-5',
          compact && 'gap-1.5 py-3 sm:py-4',
        )}
      >
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm',
            compact ? 'size-9' : 'size-10 sm:size-11',
          )}
          aria-hidden
        >
          <PlayCircle className={cn(compact ? 'size-5' : 'size-5 sm:size-6')} />
        </span>

        <Image
          src={BRAND_LOGO_WITH_TEXT_SRC}
          alt="Imóvel Periciado"
          width={180}
          height={44}
          className={cn(
            'h-auto w-[8.75rem] max-w-[min(100%,11rem)] object-contain sm:w-[9.5rem]',
            compact && 'w-[7.5rem] sm:w-[8.25rem]',
          )}
        />

        <span className="min-w-0">
          <span
            className={cn(
              'block font-bold leading-snug text-white',
              compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-[15px]',
            )}
          >
            Para tutoriais do sistema
          </span>
          <span
            className={cn(
              'mt-0.5 block leading-snug text-white/85',
              compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-[13px]',
            )}
          >
            Vídeos passo a passo no YouTube
          </span>
        </span>
      </div>
    </a>
  )
}
