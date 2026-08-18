/**
 * Admin Visual Language — Imóvel Periciado / DESIGN.md
 * Dark operational rail + tinted workspace (não template branco genérico)
 */

export const admin = {
  midnight: '#0b1b3a',
  rail: '#0f1220',
  railElevated: '#151a2e',
  text: '#101114',
  textMuted: '#686b82',
  textSubtle: '#9497a9',
  textOnDark: '#e8e9f2',
  textOnDarkMuted: '#9497a9',
  border: '#dedee5',
  borderDark: 'rgba(255,255,255,0.08)',
  appBg: '#E4E6EF',
  workspace: '#F4F5FA',
  surface: '#ffffff',
  surfaceTint: 'rgba(133,91,251,0.06)',
  surfaceTintStrong: 'rgba(133,91,251,0.11)',
  brand: '#7132f5',
  brandDark: '#5741d8',
  brandGlow: 'rgba(113,50,245,0.35)',
  success: '#026b3f',
  successBg: 'rgba(20,158,97,0.16)',
  danger: '#D92D20',
  dangerBg: '#FEF3F2',
} as const

export const ADMIN_SHELL =
  'flex min-h-[100dvh] flex-row bg-[#E4E6EF] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(113,50,245,0.08),transparent_50%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(11,27,58,0.06),transparent_50%)]'

/** Viewport travado (inbox/chat) — preenche o shell do AppLayout (h-dvh). */
export const ADMIN_SHELL_LOCKED =
  'flex h-full min-h-0 flex-1 flex-row overflow-hidden bg-[#E4E6EF] bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(113,50,245,0.08),transparent_50%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(11,27,58,0.06),transparent_50%)]'

export const ADMIN_WORKSPACE =
  'min-h-0 flex-1 overflow-auto bg-[#F4F5FA] px-3 py-3 sm:px-4 sm:py-4 lg:px-5'

/** Conteúdo full-height sem scroll externo (lista/thread scrollam por dentro). */
export const ADMIN_WORKSPACE_LOCKED =
  'flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F4F5FA] px-3 py-3 sm:px-4 sm:py-4'

export const ADMIN_SIDEBAR =
  'relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-[rgba(255,255,255,0.06)] bg-[#0f1220] transition-[width] duration-[240ms] ease-in-out lg:flex'

export const ADMIN_SIDEBAR_GLOW =
  'pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_80%_100%_at_50%_-20%,rgba(113,50,245,0.45),transparent_70%)]'

export const ADMIN_SIDEBAR_BRAND =
  'relative z-10 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-3 py-4'

export const ADMIN_NAV_SECTION =
  'mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(148,151,169,0.65)]'

export const ADMIN_NAV_LINK =
  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[rgba(232,233,242,0.72)] transition-all duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white'

export const ADMIN_NAV_LINK_ACTIVE =
  'bg-[rgba(113,50,245,0.22)] text-white shadow-[inset_0_0_0_1px_rgba(113,50,245,0.35)]'

export const ADMIN_NAV_RAIL =
  'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#7132f5] shadow-[0_0_12px_rgba(113,50,245,0.6)]'

export const ADMIN_TOPBAR =
  'relative flex h-14 shrink-0 items-center gap-2 border-b border-[#dedee5] bg-white/90 px-3 backdrop-blur-md lg:px-4'

export const ADMIN_TOPBAR_ACCENT =
  'absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7132f5] to-transparent opacity-80'

export const ADMIN_PANEL =
  'overflow-hidden rounded-xl border border-[rgba(113,50,245,0.12)] bg-white shadow-[0_1px_2px_rgba(16,17,20,0.04),0_8px_24px_rgba(11,27,58,0.06)]'

export const ADMIN_PANEL_INTELLIGENCE =
  'overflow-hidden rounded-xl border border-[rgba(113,50,245,0.18)] bg-gradient-to-b from-[rgba(133,91,251,0.07)] to-white shadow-[0_4px_20px_rgba(113,50,245,0.08)]'

export const ADMIN_PANEL_HEADER =
  'flex items-center justify-between gap-2 border-b border-[rgba(113,50,245,0.1)] bg-[rgba(133,91,251,0.04)] px-3 py-2.5'

export const ADMIN_COMMAND_BAR =
  'flex flex-col gap-2 rounded-xl border border-[rgba(113,50,245,0.14)] bg-gradient-to-r from-white via-white to-[rgba(133,91,251,0.04)] px-3 py-2 shadow-[0_1px_3px_rgba(11,27,58,0.06)] sm:flex-row sm:items-center sm:justify-between'

export const ADMIN_KPI =
  'relative overflow-hidden rounded-xl border border-[rgba(113,50,245,0.12)] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(16,17,20,0.04)] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-[#5741d8] before:to-[#7132f5]'

export const ADMIN_INPUT =
  'w-full rounded-lg border border-[#dedee5] bg-[#FAFAFB] px-3 py-2 text-sm text-[#101114] outline-none transition focus:border-[#7132f5] focus:bg-white focus:ring-2 focus:ring-[rgba(133,91,251,0.18)]'

export const ADMIN_LABEL =
  'text-[10px] font-bold uppercase tracking-[0.08em] text-[#9497a9]'

export const ADMIN_TABLE_WRAP = `${ADMIN_PANEL} overflow-hidden`

export const ADMIN_TABLE_HEAD =
  'sticky top-0 z-[1] border-b border-[rgba(113,50,245,0.12)] bg-[rgba(11,27,58,0.03)] text-[10px] font-bold uppercase tracking-[0.08em] text-[#686b82]'

export const ADMIN_TABLE_ROW =
  'group border-b border-[#ededf2] last:border-b-0 transition-colors duration-150'

export const ADMIN_TABLE_ROW_HOVER = 'cursor-pointer hover:bg-[rgba(133,91,251,0.05)]'

export const ADMIN_TABLE_ROW_ACTIVE =
  'bg-[rgba(133,91,251,0.09)] shadow-[inset_3px_0_0_0_#7132f5]'

export const ADMIN_INBOX_ITEM =
  'relative flex w-full gap-2.5 rounded-lg px-2 py-2 text-left transition-all duration-150'

export const ADMIN_INBOX_ITEM_ACTIVE =
  'bg-[rgba(133,91,251,0.1)] shadow-[inset_3px_0_0_0_#7132f5]'

export const ADMIN_ICON_BTN =
  'inline-flex size-8 items-center justify-center rounded-lg border border-[#dedee5] bg-white text-[#686b82] shadow-sm transition hover:border-[#7132f5]/40 hover:bg-[rgba(133,91,251,0.08)] hover:text-[#5741d8]'

export const ADMIN_BTN_PRIMARY =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#7132f5] px-4 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(113,50,245,0.35)] transition hover:bg-[#5741d8] disabled:opacity-50'

export const ADMIN_BTN_GHOST =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dedee5] bg-white px-3 text-xs font-semibold text-[#686b82] transition hover:border-[#7132f5]/30 hover:text-[#5741d8]'

/** @deprecated use ADMIN_PANEL */
export const ADMIN_CARD = ADMIN_PANEL
export const ADMIN_APP_BG = ADMIN_SHELL
export const ADMIN_PANEL_SECONDARY = ADMIN_PANEL_INTELLIGENCE
export const ADMIN_TOOLBAR = ADMIN_COMMAND_BAR
export const ADMIN_NAV_ITEM = ADMIN_NAV_LINK
export const ADMIN_NAV_ITEM_ACTIVE = ADMIN_NAV_LINK_ACTIVE
