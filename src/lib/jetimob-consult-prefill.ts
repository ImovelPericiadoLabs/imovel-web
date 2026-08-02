export const JETIMOB_CONSULT_PREFILL_KEY = 'jetimobConsultPrefill'

export type JetimobConsultEntryPath = 'address' | 'document' | 'registry'

export type JetimobConsultInitialFlow =
  | 'entry'
  | 'registry-manual'
  | 'address-hint'
  | 'doc-type'

export type JetimobConsultPrefill = {
  source: 'jetimob'
  propertyCode: string
  systemId?: string
  entryPath: JetimobConsultEntryPath
  initialFlow: JetimobConsultInitialFlow
  form: Record<string, unknown>
}

export type JetimobConsultModeDraft = {
  available: boolean
  missing_fields?: string[]
  preview?: Record<string, unknown>
  form: Record<string, unknown>
  initial_flow: JetimobConsultInitialFlow
}

export type JetimobConsultDraftResponse = {
  property_code?: string
  source?: string
  modes?: {
    address?: JetimobConsultModeDraft
    registry?: JetimobConsultModeDraft
    document?: JetimobConsultModeDraft
  }
  error?: { message?: string }
}

export function buildJetimobConsultPrefill(
  propertyCode: string,
  mode: JetimobConsultModeDraft,
  entryPath: JetimobConsultEntryPath,
  systemId?: string,
): JetimobConsultPrefill {
  return {
    source: 'jetimob',
    propertyCode,
    systemId,
    entryPath,
    initialFlow: mode.initial_flow,
    form: mode.form,
  }
}

export function storeJetimobConsultPrefill(prefill: JetimobConsultPrefill): void {
  sessionStorage.setItem(JETIMOB_CONSULT_PREFILL_KEY, JSON.stringify(prefill))
}

export function readJetimobConsultPrefill(): JetimobConsultPrefill | null {
  const raw = sessionStorage.getItem(JETIMOB_CONSULT_PREFILL_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as JetimobConsultPrefill
    if (parsed?.source !== 'jetimob' || !parsed.entryPath || !parsed.initialFlow) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearJetimobConsultPrefill(): void {
  sessionStorage.removeItem(JETIMOB_CONSULT_PREFILL_KEY)
}
