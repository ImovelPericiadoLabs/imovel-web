/** Contraste derivado da superfície — tons frios integrados, sem glow em body. */

export type SurfaceVariant = 'dark' | 'light' | 'glass' | 'accent'

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

/** Tons compartilhados entre lead e início do gradiente (continuidade cromática). */
export const coolNeutral = {
  onDark: '#94a3b8',
  onLight: '#64748b',
} as const

export const typographyWeight = {
  hero: 'font-bold tracking-[-0.035em]',
  heroSecondary: 'font-bold tracking-[-0.03em]',
  section: 'font-semibold tracking-tight',
  description: 'font-medium tracking-[-0.01em]',
  eyebrow: 'font-medium uppercase tracking-widest',
}

/** Cores de título (peso vem em composeHeroTitle). */
export const titleColorPrimaryOnDark = 'text-white/95'
export const titleColorSecondaryOnDark = 'text-slate-600'
export const titleColorPrimaryOnLight = 'text-slate-900'
export const titleColorSecondaryOnLight = 'text-slate-700'
export const titleColorPrimaryOnGlass = 'text-white/95'
export const titleColorSecondaryOnGlass = 'text-slate-600'
export const titleColorPrimaryOnAccent = 'text-slate-900'
export const titleColorSecondaryOnAccent = 'text-slate-600'

/** @deprecated use getHeroTitleColor */
export const titleOnDark = join(typographyWeight.hero, titleColorPrimaryOnDark)
export const titleOnLight = join(typographyWeight.hero, titleColorPrimaryOnLight)
export const titleOnGlass = join(typographyWeight.hero, titleColorPrimaryOnGlass)
export const titleOnAccent = join(typographyWeight.hero, titleColorPrimaryOnAccent)

export const descriptionOnDark = join(typographyWeight.description, 'text-slate-400/90')
export const descriptionOnLight = join(typographyWeight.description, 'text-slate-500/95')
export const descriptionOnGlass = join(typographyWeight.description, 'text-slate-400/88')
export const descriptionOnAccent = join(typographyWeight.description, 'text-slate-600')

export const leadOnDark = join(typographyWeight.description, 'text-[#94a3b8]')
export const leadOnLight = join(typographyWeight.description, 'text-slate-500/95')
export const leadOnGlass = join(typographyWeight.description, 'text-[#94a3b8]/90')
export const leadOnAccent = join(typographyWeight.description, 'text-slate-600')

/** Gradiente inline: nasce do neutro frio e flui para indigo/violeta suave — sem glow, sem peso extra. */
export const gradientAccentInline = join(
  'bg-gradient-to-r from-[#94a3b8] via-[#6366F1] to-[#8B5CF6] bg-clip-text font-medium text-transparent',
)

export const gradientAccentInlineOnLight = join(
  'bg-gradient-to-r from-[#64748b] via-[#6366F1] to-[#7C3AED] bg-clip-text font-medium text-transparent',
)

export const eyebrowOnDark = join(typographyWeight.eyebrow, 'text-[10px] text-slate-400/85')
export const eyebrowOnLight = join(typographyWeight.eyebrow, 'text-[10px] text-slate-500')
export const eyebrowOnGlass = join(typographyWeight.eyebrow, 'text-[10px] text-slate-400/85')
export const eyebrowOnAccent = join(typographyWeight.eyebrow, 'text-[10px] text-slate-500')

type HeroTitleLevel = 'primary' | 'secondary' | 'large'

const titlePrimaryBySurface: Record<SurfaceVariant, string> = {
  dark: titleColorPrimaryOnDark,
  light: titleColorPrimaryOnLight,
  glass: titleColorPrimaryOnGlass,
  accent: titleColorPrimaryOnAccent,
}

const titleSecondaryBySurface: Record<SurfaceVariant, string> = {
  dark: titleColorSecondaryOnDark,
  light: titleColorSecondaryOnLight,
  glass: titleColorSecondaryOnGlass,
  accent: titleColorSecondaryOnAccent,
}

const descriptionBySurface: Record<SurfaceVariant, string> = {
  dark: descriptionOnDark,
  light: descriptionOnLight,
  glass: descriptionOnGlass,
  accent: descriptionOnAccent,
}

const leadBySurface: Record<SurfaceVariant, string> = {
  dark: leadOnDark,
  light: leadOnLight,
  glass: leadOnGlass,
  accent: leadOnAccent,
}

const gradientBySurface: Record<SurfaceVariant, string> = {
  dark: gradientAccentInline,
  light: gradientAccentInlineOnLight,
  glass: gradientAccentInline,
  accent: gradientAccentInlineOnLight,
}

const eyebrowBySurface: Record<SurfaceVariant, string> = {
  dark: eyebrowOnDark,
  light: eyebrowOnLight,
  glass: eyebrowOnGlass,
  accent: eyebrowOnAccent,
}

export function getTitleContrast(surface: SurfaceVariant) {
  return titlePrimaryBySurface[surface]
}

export function getHeroTitleColor(level: HeroTitleLevel, surface: SurfaceVariant) {
  if (level === 'secondary') return titleSecondaryBySurface[surface]
  return titlePrimaryBySurface[surface]
}

export function getDescriptionContrast(surface: SurfaceVariant) {
  return descriptionBySurface[surface]
}

export function getLeadContrast(surface: SurfaceVariant) {
  return leadBySurface[surface]
}

export function getGradientAccent(surface: SurfaceVariant = 'dark') {
  return gradientBySurface[surface]
}

export function getEyebrowContrast(surface: SurfaceVariant) {
  return eyebrowBySurface[surface]
}
