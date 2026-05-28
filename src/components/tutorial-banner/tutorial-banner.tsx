'use client'

import Image from 'next/image'
import { PlayCircle } from 'lucide-react'
import { BRAND_LOGO_LIGHT_SRC } from '@/constants/brand-logo'
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
        'group relative flex w-full min-h-[8.5rem] overflow-hidden rounded-2xl border border-primary/25 shadow-sm transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-md sm:min-h-[9rem]',
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b1b3a]/92 via-[#0b1b3a]/70 to-[#142a5b]/45"
        aria-hidden
      />

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5 px-4 py-4 text-center',
          'sm:gap-3 sm:py-5',
          'lg:flex-row lg:items-center lg:justify-center lg:gap-6 lg:px-6 lg:py-4 lg:text-left',
          compact && 'gap-2 py-3 sm:py-4 lg:py-3',
        )}
      >
        <div className="flex shrink-0 flex-col items-center gap-2 lg:items-center">
          <span
            className={cn(
              'flex items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm',
              compact ? 'size-9' : 'size-10 sm:size-11',
            )}
            aria-hidden
          >
            <PlayCircle className={cn(compact ? 'size-5' : 'size-5 sm:size-6')} />
          </span>

          <Image
            src={BRAND_LOGO_LIGHT_SRC}
            alt="Imóvel Periciado"
            width={203}
            height={83}
            className={cn(
              'h-auto w-[8.75rem] max-w-[min(100%,11rem)] object-contain sm:w-[9.5rem]',
              compact && 'w-[7.5rem] sm:w-[8.25rem]',
            )}
          />
        </div>

        <span className="min-w-0 lg:flex-1">
          <span
            className={cn(
              'block font-bold leading-snug text-white',
              compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-[15px] lg:text-base',
            )}
          >
            Para tutoriais do sistema
          </span>
          <span
            className={cn(
              'mt-0.5 block leading-snug text-white/90',
              compact ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-[13px] lg:text-sm',
            )}
          >
            Vídeos passo a passo no YouTube
          </span>
        </span>
      </div>
    </a>
  )
}
