import type { LucideIcon } from 'lucide-react'
import {
  FileCheck,
  FileSearch,
  Landmark,
  Lock,
  MapPin,
  Megaphone,
  ScrollText,
  Shield,
  Sparkles,
  TreePine,
  Users,
} from 'lucide-react'

import type { AnalysisProgress } from '@/domain/order-analysis-progress'
import { resolveAnalysisProgressLabel } from '@/domain/order-analysis-progress'
import type { OrderEvent } from '@/services/orders'
import type { OrderStatusUIConfig } from '@/domain/order-journey'

export type LiveProcessTheme = {
  card: string
  iconWrap: string
  iconColor: string
  accent: string
  title: string
  Icon: LucideIcon
}

export type LiveProcessView = {
  processTitle: string
  theme: LiveProcessTheme
  marco: string
}

const AGENT_PALETTE: LiveProcessTheme[] = [
  {
    card: 'border-violet-300/50 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5',
    iconWrap: 'bg-violet-500/15',
    iconColor: 'text-violet-700',
    accent: 'text-violet-700',
    title: 'text-violet-950',
    Icon: FileSearch,
  },
  {
    card: 'border-rose-300/50 bg-gradient-to-br from-rose-500/10 to-orange-500/5',
    iconWrap: 'bg-rose-500/15',
    iconColor: 'text-rose-700',
    accent: 'text-rose-700',
    title: 'text-rose-950',
    Icon: Shield,
  },
  {
    card: 'border-teal-300/50 bg-gradient-to-br from-teal-500/10 to-cyan-500/5',
    iconWrap: 'bg-teal-500/15',
    iconColor: 'text-teal-700',
    accent: 'text-teal-700',
    title: 'text-teal-950',
    Icon: Landmark,
  },
  {
    card: 'border-amber-300/50 bg-gradient-to-br from-amber-500/12 to-yellow-500/5',
    iconWrap: 'bg-amber-500/15',
    iconColor: 'text-amber-800',
    accent: 'text-amber-800',
    title: 'text-amber-950',
    Icon: Lock,
  },
  {
    card: 'border-indigo-300/50 bg-gradient-to-br from-indigo-500/10 to-blue-500/5',
    iconWrap: 'bg-indigo-500/15',
    iconColor: 'text-indigo-700',
    accent: 'text-indigo-700',
    title: 'text-indigo-950',
    Icon: Megaphone,
  },
  {
    card: 'border-emerald-300/50 bg-gradient-to-br from-emerald-500/10 to-green-500/5',
    iconWrap: 'bg-emerald-500/15',
    iconColor: 'text-emerald-700',
    accent: 'text-emerald-700',
    title: 'text-emerald-950',
    Icon: TreePine,
  },
  {
    card: 'border-sky-300/50 bg-gradient-to-br from-sky-500/10 to-blue-500/5',
    iconWrap: 'bg-sky-500/15',
    iconColor: 'text-sky-700',
    accent: 'text-sky-700',
    title: 'text-sky-950',
    Icon: Users,
  },
  {
    card: 'border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5',
    iconWrap: 'bg-fuchsia-500/15',
    iconColor: 'text-fuchsia-700',
    accent: 'text-fuchsia-700',
    title: 'text-fuchsia-950',
    Icon: ScrollText,
  },
]

const STEP_THEMES: Record<string, LiveProcessTheme> = {
  started: {
    card: 'border-[#7132f5]/25 bg-gradient-to-br from-[#7132f5]/10 to-violet-500/5',
    iconWrap: 'bg-[#7132f5]/15',
    iconColor: 'text-[#7132f5]',
    accent: 'text-[#7132f5]',
    title: 'text-[#101114]',
    Icon: Sparkles,
  },
  enrollment: {
    card: 'border-cyan-300/50 bg-gradient-to-br from-cyan-500/10 to-sky-500/5',
    iconWrap: 'bg-cyan-500/15',
    iconColor: 'text-cyan-700',
    accent: 'text-cyan-700',
    title: 'text-cyan-950',
    Icon: ScrollText,
  },
  owners: {
    card: 'border-emerald-300/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/5',
    iconWrap: 'bg-emerald-500/15',
    iconColor: 'text-emerald-700',
    accent: 'text-emerald-700',
    title: 'text-emerald-950',
    Icon: Users,
  },
  finalizing: {
    card: 'border-green-300/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5',
    iconWrap: 'bg-green-500/15',
    iconColor: 'text-green-700',
    accent: 'text-green-700',
    title: 'text-green-950',
    Icon: FileCheck,
  },
  enrich_place: {
    card: 'border-sky-300/50 bg-gradient-to-br from-sky-500/10 to-indigo-500/5',
    iconWrap: 'bg-sky-500/15',
    iconColor: 'text-sky-700',
    accent: 'text-sky-700',
    title: 'text-sky-950',
    Icon: MapPin,
  },
  search: {
    card: 'border-blue-300/50 bg-gradient-to-br from-blue-500/10 to-indigo-500/5',
    iconWrap: 'bg-blue-500/15',
    iconColor: 'text-blue-700',
    accent: 'text-blue-700',
    title: 'text-blue-950',
    Icon: MapPin,
  },
  queue: {
    card: 'border-[#7132f5]/20 bg-gradient-to-br from-[#7132f5]/8 to-violet-500/4',
    iconWrap: 'bg-[#7132f5]/12',
    iconColor: 'text-[#7132f5]',
    accent: 'text-[#7132f5]',
    title: 'text-[#101114]',
    Icon: Sparkles,
  },
}

function hashTitle(title: string): number {
  let h = 0
  for (let i = 0; i < title.length; i += 1) {
    h = (h + title.charCodeAt(i) * (i + 1)) % AGENT_PALETTE.length
  }
  return h
}

function pickAgentIcon(title: string): LucideIcon {
  const t = title.toLowerCase()
  if (t.includes('usufruto') || t.includes('propriet')) return Users
  if (t.includes('hipoteca') || t.includes('alienação') || t.includes('fiduci')) return Landmark
  if (t.includes('penhora') || t.includes('arresto') || t.includes('sequestro')) return Lock
  if (t.includes('ambient') || t.includes('tombamento')) return TreePine
  if (t.includes('servidão') || t.includes('passagem')) return ScrollText
  if (t.includes('publicidade') || t.includes('ação')) return Megaphone
  if (t.includes('cláusula') || t.includes('indispon')) return Shield
  return FileSearch
}

/** Nome do processo sem prefixos verbosos (ex.: só "Usufruto", não "Analisando: Usufruto"). */
export function formatProcessTitle(
  rawLabel: string,
  step: string,
  agentTitle?: string,
): string {
  const agent = (agentTitle || '').trim()
  if (agent) return agent

  let t = rawLabel.trim()
  if (!t) return 'Análise do documento'

  if (t.startsWith('Analisando:')) {
    return t.slice('Analisando:'.length).trim() || t
  }
  if (t.startsWith('Identificando ')) {
    return t.slice('Identificando '.length).trim()
  }
  if (t.startsWith('Extraindo ')) {
    return t.slice('Extraindo '.length).trim()
  }
  if (t.startsWith('Iniciando ')) {
    return t.slice('Iniciando '.length).trim()
  }
  if (t.startsWith('Finalizando ')) {
    return t.slice('Finalizando '.length).trim()
  }
  if (t.startsWith('Completando ')) {
    return t.slice('Completando '.length).trim()
  }

  if (step === 'agent') return t

  return t.replace(/…$/, '').trim()
}

export function resolveProcessTheme(step: string, processTitle: string): LiveProcessTheme {
  if (step && STEP_THEMES[step]) {
    const base = STEP_THEMES[step]!
    if (step === 'agent') {
      const palette = AGENT_PALETTE[hashTitle(processTitle)]!
      return { ...palette, Icon: pickAgentIcon(processTitle) }
    }
    return base
  }

  if (step === 'agent' || processTitle) {
    const palette = AGENT_PALETTE[hashTitle(processTitle)]!
    return { ...palette, Icon: pickAgentIcon(processTitle) }
  }

  return STEP_THEMES.started!
}

export function resolveLiveProcessView(
  statusValue: string | undefined,
  ui: OrderStatusUIConfig,
  progress: AnalysisProgress | null | undefined,
  events: OrderEvent[],
  paymentConfirmed: boolean,
): LiveProcessView {
  if (statusValue === 'IN_PROGRESS') {
    const step = (progress?.step || '').trim()
    const raw =
      resolveAnalysisProgressLabel(statusValue, progress, events) ||
      'Análise do documento'
    const processTitle = formatProcessTitle(
      raw,
      step,
      progress?.agent_title,
    )
    return {
      processTitle,
      theme: resolveProcessTheme(step || 'agent', processTitle),
      marco: ui.label,
    }
  }

  if (statusValue === 'SEARCHING_DOCUMENT') {
    return {
      processTitle: 'Busca da matrícula nos cartórios',
      theme: STEP_THEMES.search!,
      marco: ui.label,
    }
  }

  if (statusValue === 'PENDING' && paymentConfirmed) {
    return {
      processTitle: 'Preparando busca da matrícula',
      theme: STEP_THEMES.queue!,
      marco: ui.label,
    }
  }

  return {
    processTitle: ui.label,
    theme: STEP_THEMES.queue!,
    marco: ui.label,
  }
}
