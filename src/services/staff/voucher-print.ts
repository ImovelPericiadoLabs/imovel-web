export type PrintLayout = 'duplex' | 'stacked'
export type DuplexFlip = 'long-edge' | 'short-edge'
export type StackedVerso = 'fold' | 'cut'

export type BatchPdfPrintConfig = {
  layout: PrintLayout
  duplex: DuplexFlip
  verso: StackedVerso
}

export const DEFAULT_PRINT_CONFIG: BatchPdfPrintConfig = {
  layout: 'duplex',
  duplex: 'long-edge',
  verso: 'fold',
}

export function batchPdfPayload(config: BatchPdfPrintConfig, force = false) {
  if (config.layout === 'stacked') {
    return { layout: 'stacked' as const, verso: config.verso, force }
  }
  return { layout: 'duplex' as const, duplex: config.duplex, force }
}

export function batchPdfQuery(config: BatchPdfPrintConfig) {
  const payload = batchPdfPayload(config)
  const params = new URLSearchParams()
  params.set('layout', payload.layout)
  if ('verso' in payload) params.set('verso', payload.verso)
  if ('duplex' in payload) params.set('duplex', payload.duplex)
  return params.toString()
}

export function printProofHint(config: BatchPdfPrintConfig) {
  if (config.layout === 'stacked') {
    return config.verso === 'fold'
      ? 'PDF gerado. Imprima UMA folha, dobre no meio e confira se o verso fica em pé atrás da própria frente.'
      : 'PDF gerado. Imprima UMA folha, corte na linha central e confira se o verso bate com a frente.'
  }
  return (
    'PDF gerado. Antes de rodar a tiragem, peça à gráfica uma folha de prova em ' +
    'duplex: imprime, vira e confira se o verso caiu atrás da própria frente.'
  )
}
