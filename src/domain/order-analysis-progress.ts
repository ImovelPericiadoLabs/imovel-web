import type { OrderEvent } from '@/services/orders'

export type AnalysisProgress = {
  step?: string
  label?: string
  agent_title?: string
  agent_slug?: string
  updated_at?: string
}

export const ANALYSIS_STEP_EVENT = 'ANALYSIS_STEP'

export function getAnalysisStepEvents(events: OrderEvent[]): OrderEvent[] {
  return events.filter((ev) => ev.type === ANALYSIS_STEP_EVENT)
}

export function resolveAnalysisProgressLabel(
  statusValue: string | undefined,
  progress: AnalysisProgress | null | undefined,
  events: OrderEvent[],
): string | null {
  if (statusValue !== 'IN_PROGRESS') return null

  const label = (progress?.label || '').trim()
  if (label) return label

  const steps = getAnalysisStepEvents(events)
  const last = steps[steps.length - 1]
  const fromEvent = (last?.payload?.label as string | undefined)?.trim()
  if (fromEvent) return fromEvent

  return 'Analisando documento…'
}

export function buildAnalysisSubsteps(events: OrderEvent[]): { id: string; label: string }[] {
  const seen = new Set<string>()
  const rows: { id: string; label: string }[] = []

  for (const ev of getAnalysisStepEvents(events)) {
    const label = String(ev.payload?.label || '').trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    rows.push({ id: ev.id, label })
  }

  return rows
}
