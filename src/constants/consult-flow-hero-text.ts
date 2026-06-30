/**
 * Aliases do fluxo de consulta — delegam ao design system em @/styles.
 * Migração gradual: prefira Surface + @/components/ui/typography.
 */

import { centeredContent } from '@/styles/layout'
import {
  darkHeroSurfaceBand,
  darkHeroSurfaceGradient,
  darkHeroSurfaceGradientFinished,
  darkHeroSurfaceShell,
} from '@/styles/surfaces'
import {
  composeGradientText,
  composeHeroDescription,
  composeLeadText,
  heroTitle,
} from '@/styles/typography'

export const consultFlowShellGradientClass = darkHeroSurfaceGradient
export const consultFlowShellGradientFinishedClass = darkHeroSurfaceGradientFinished
export const consultFlowShellBandClass = darkHeroSurfaceBand
export { darkHeroSurfaceShell as consultFlowShellClass }

export const consultFlowHeroSectionClass = centeredContent.hero
export const consultFlowHeroBlockClass = centeredContent.heroBlock

export const consultFlowHeroTitleClass = heroTitle.baseOnDark
export const consultFlowHeroTitleSecondaryClass = heroTitle.secondaryOnDark

export const consultFlowHeroTitleSizePrimaryClass = heroTitle.primary
export const consultFlowHeroTitleSizeSecondaryClass = heroTitle.secondary
export const consultFlowHeroTitleSizeLargeClass = heroTitle.large

export const consultFlowHeroSubtitleClass = composeHeroDescription('subtitle', 'dark')
export const consultFlowHeroBodyClass = composeHeroDescription('body', 'dark')
export const consultFlowHeroLeadPrefixClass = composeLeadText('dark')
export const consultFlowHeroAccentClass = composeGradientText('dark')
