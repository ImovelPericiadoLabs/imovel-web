import type { RecipientRules } from '@/services/outreach'

export function emptyRecipientRules(): RecipientRules {
  return { empty_fill: {}, by_row: {}, skip_rows: [] }
}

/** Aceita apenas chaves suportadas pela API (`empty_fill`, `by_row`, `skip_rows`). */
export function normalizeRecipientRules(raw: unknown): RecipientRules {
  const out = emptyRecipientRules()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const o = raw as Record<string, unknown>

  if (o.empty_fill && typeof o.empty_fill === 'object' && !Array.isArray(o.empty_fill)) {
    const ef: Record<string, string> = {}
    for (const [k, v] of Object.entries(o.empty_fill as Record<string, unknown>)) {
      if (typeof v === 'string') ef[k] = v
    }
    out.empty_fill = ef
  }

  if (o.by_row && typeof o.by_row === 'object' && !Array.isArray(o.by_row)) {
    const br: Record<string, Record<string, string>> = {}
    for (const [rowKey, inner] of Object.entries(o.by_row as Record<string, unknown>)) {
      if (typeof inner !== 'object' || inner === null || Array.isArray(inner)) continue
      const innerOut: Record<string, string> = {}
      for (const [ik, iv] of Object.entries(inner as Record<string, unknown>)) {
        if (typeof iv === 'string') innerOut[ik] = iv
      }
      br[rowKey] = innerOut
    }
    out.by_row = br
  }

  if (Array.isArray(o.skip_rows)) {
    out.skip_rows = o.skip_rows
      .map((x) => (typeof x === 'number' ? x : typeof x === 'string' ? parseInt(x, 10) : NaN))
      .filter((n) => Number.isFinite(n) && n >= 0 && Number.isInteger(n))
  }

  return out
}

/** Payload limpo para PATCH / export (sem chaves vazias redundantes). */
export function recipientRulesToApiPayload(rules: RecipientRules): RecipientRules {
  const empty_fill = rules.empty_fill && Object.keys(rules.empty_fill).length ? { ...rules.empty_fill } : {}
  const by_row = rules.by_row && Object.keys(rules.by_row).length ? { ...rules.by_row } : {}
  const skip_rows =
    rules.skip_rows?.length && rules.skip_rows.length > 0
      ? [...new Set(rules.skip_rows)].sort((a, b) => a - b)
      : []
  return { empty_fill, by_row, skip_rows }
}

export function formatRecipientRulesSummary(rules: unknown): string {
  const n = normalizeRecipientRules(rules)
  const ef = Object.keys(n.empty_fill ?? {}).length
  const br = Object.keys(n.by_row ?? {}).length
  const sk = (n.skip_rows ?? []).length
  if (ef + br + sk === 0) return '—'
  const parts: string[] = []
  if (ef) parts.push(`${ef} preenchimento global`)
  if (br) parts.push(`${br} linha(s) com excepções`)
  if (sk) parts.push(`${sk} ignorada(s)`)
  return parts.join(' · ')
}
