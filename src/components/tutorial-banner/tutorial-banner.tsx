'use client'

import Image from 'next/image'
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
        'group relative flex w-full min-h-[5.5rem] overflow-hidden rounded-2xl border border-primary/25 text-left shadow-sm transition-[box-shadow,border-color] hover:border-primary/40 hover:shadow-md sm:min-h-[6.25rem]',
        compact && 'min-h-[5rem] rounded-xl sm:min-h-[5.5rem]',
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
          'relative z-10 flex w-full items-center gap-3 px-3 py-3 sm:px-4',
          compact && 'px-3 py-2.5',
        )}
      >
        <Image
          src="/images/logo-mini.svg"
          alt=""
          width={40}
          height={40}
          className={cn(
            'hidden shrink-0 opacity-90 sm:block',
            compact ? 'size-8' : 'size-9 lg:size-10',
          )}
          aria-hidden
        />

        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm',
            compact ? 'size-9' : 'size-10 sm:size-11',
          )}
          aria-hidden
        >
          <PlayCircle className={cn(compact ? 'size-5' : 'size-5 sm:size-6')} />
        </span>

        <span className="min-w-0 flex-1">
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
          <Image
            src="/images/logo_text.svg"
            alt="Imóvel Periciado"
            width={140}
            height={28}
            className={cn(
              'mt-1.5 h-auto w-[7.5rem] max-w-[min(100%,10rem)] opacity-95 sm:mt-2 sm:w-[8.5rem]',
              compact && 'mt-1 w-[6.5rem] sm:w-[7.25rem]',
            )}
          />
        </span>
      </div>
    </a>
  )
}
