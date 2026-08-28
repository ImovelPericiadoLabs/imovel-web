export type PrintLayout = 'duplex' | 'stacked'
export type DuplexFlip = 'long-edge' | 'short-edge'
export type StackedVerso = 'fold' | 'cut' | 'join'

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
  const params = new URLSearchParams()
  if (config.layout === 'stacked') {
    params.set('layout', 'stacked')
    params.set('verso', config.verso)
  } else {
    params.set('layout', 'duplex')
    params.set('duplex', config.duplex)
  }
  return params.toString()
}

export function printProofHint(config: BatchPdfPrintConfig) {
  if (config.layout === 'stacked') {
    if (config.verso === 'fold') {
      return 'PDF gerado. Imprima UMA folha, dobre no meio e confira se o verso fica em pé atrás da própria frente.'
    }
    if (config.verso === 'join') {
      return 'PDF gerado. Imprima UMA folha e confira se frente e verso do mesmo cartão ficam juntos, sem dobrar nem cortar no meio.'
    }
    return 'PDF gerado. Imprima UMA folha, corte na linha central e confira se o verso bate com a frente.'
  }
  return (
    'PDF gerado. Antes de rodar a tiragem, peça à gráfica uma folha de prova em ' +
    'duplex: imprime, vira e confira se o verso caiu atrás da própria frente.'
  )
}
