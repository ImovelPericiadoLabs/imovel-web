/** Composição tipográfica — cores e pesos vêm de @/styles/contrast. */

import type { SurfaceVariant } from '@/styles/contrast'
import {
  getDescriptionContrast,
  getEyebrowContrast,
  getGradientAccent,
  getLeadContrast,
  getHeroTitleColor,
  getTitleContrast,
  typographyWeight,
} from '@/styles/contrast'

export type { SurfaceVariant }
export type TypographySurface = SurfaceVariant
export type HeroTitleVariant = 'primary' | 'secondary' | 'large'

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

const heroTitleRhythm = 'text-balance leading-[1.08]'

const heroLayout = {
  primary: 'w-full max-w-[54ch] text-[clamp(1rem,2.4vw+0.55rem,1.65rem)]',
  secondary: 'w-full max-w-[44ch] text-[clamp(1rem,1.8vw+0.5rem,1.25rem)]',
  large: 'w-full max-w-[56ch] text-[clamp(1.125rem,2.8vw+0.5rem,2rem)]',
}

const heroDescriptionLayout = {
  base: join(typographyWeight.description, 'text-pretty text-balance leading-[1.65]'),
  body: 'w-full max-w-[50ch] text-[clamp(0.875rem,1.2vw+0.5rem,0.975rem)]',
  subtitle: 'w-full max-w-[50ch] text-[clamp(0.875rem,1.2vw+0.5rem,1rem)]',
}

const sectionLayout = {
  base: join(typographyWeight.section, 'text-balance leading-snug'),
  large: 'w-full max-w-[52ch] text-[clamp(1.125rem,2.5vw+0.5rem,1.5rem)]',
  default: 'w-full max-w-[48ch] text-lg',
}

const sectionDescriptionLayout = {
  base: join(typographyWeight.description, 'text-pretty text-balance leading-relaxed'),
  default: 'w-full max-w-[50ch] text-sm text-[clamp(0.875rem,1.1vw+0.45rem,1rem)]',
}

export const heroTitle = {
  ...heroLayout,
  baseOnDark: join(typographyWeight.hero, heroTitleRhythm, getTitleContrast('dark')),
  secondaryOnDark: join(typographyWeight.heroSecondary, heroTitleRhythm, getHeroTitleColor('secondary', 'dark')),
}

export const heroDescription = heroDescriptionLayout

export const sectionTitle = sectionLayout
export const sectionDescription = sectionDescriptionLayout

export const cardTitle = {
  base: 'font-semibold leading-snug text-slate-900 text-sm lg:text-[15px]',
}

export const cardDescription = {
  base: 'font-medium leading-relaxed text-slate-600 text-xs lg:text-[13px]',
}

export const eyebrowText = {
  base: getEyebrowContrast('light'),
  onDark: getEyebrowContrast('dark'),
}

const center = 'mx-auto w-full text-center'

export function composeHeroTitle(
  variant: HeroTitleVariant = 'primary',
  surface: SurfaceVariant = 'dark',
) {
  const weight =
    variant === 'secondary' ? typographyWeight.heroSecondary : typographyWeight.hero

  return join(weight, heroTitleRhythm, getHeroTitleColor(variant, surface), heroLayout[variant], center)
}

export function composeHeroDescription(
  kind: 'subtitle' | 'body' = 'subtitle',
  surface: SurfaceVariant = 'dark',
) {
  return join(
    heroDescriptionLayout.base,
    getDescriptionContrast(surface),
    heroDescriptionLayout[kind],
    center,
  )
}

export function composeLeadText(surface: SurfaceVariant = 'dark') {
  return getLeadContrast(surface)
}

export function composeSectionTitle(size: 'default' | 'large' = 'default', surface: SurfaceVariant = 'light') {
  return join(sectionLayout.base, getTitleContrast(surface), sectionLayout[size], center)
}

export function composeSectionDescription(surface: SurfaceVariant = 'light') {
  return join(sectionDescriptionLayout.base, getDescriptionContrast(surface), sectionDescriptionLayout.default, center)
}

export function composeEyebrowText(surface: SurfaceVariant = 'light') {
  return join(getEyebrowContrast(surface), center)
}

export function composeGradientText(surface: SurfaceVariant = 'dark') {
  return getGradientAccent(surface)
}
