/** Superfícies semânticas — fundos e comportamento de contraste. */

import { flowHeroShell } from '@/styles/layout'

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

export const darkHeroSurfaceShell = 'relative shrink-0 transition-[background] duration-500'

export const darkHeroSurfaceGradient =
  'bg-gradient-to-b from-[#0b1b3a] via-[#0f2247] via-[78%] via-[#142a5b] via-[94%] to-background'

export const darkHeroSurfaceGradientFinished =
  'bg-gradient-to-b from-emerald-600 via-emerald-600 via-[70%] to-background'

export const darkHeroSurfaceBand = join('pointer-events-none', flowHeroShell.band)

export const darkHeroSurface = join(darkHeroSurfaceShell, darkHeroSurfaceGradient)

export const darkHeroSurfaceFinished = join(darkHeroSurfaceShell, darkHeroSurfaceGradientFinished)

export const lightSectionSurface = 'bg-background'

export const cardSurface = join(
  'rounded-2xl border border-gray-100 bg-white shadow-sm',
)

export const glassSurface = join(
  'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm',
)

export const accentSurface = join(
  'rounded-2xl border border-primary/25 bg-primary/[0.04]',
)

export const darkHeroSurfaceColors = {
  navyDeep: '#081028',
  navy: '#0F172A',
  blue: '#1D4ED8',
  blueMuted: '#60A5FA',
  white: '#FFFFFF',
  slateLight: '#E2E8F0',
} as const

export const lightSectionSurfaceColors = {
  white: '#FFFFFF',
  ice: '#F8FAFC',
  title: '#111827',
  body: '#334155',
  muted: '#475569',
} as const
