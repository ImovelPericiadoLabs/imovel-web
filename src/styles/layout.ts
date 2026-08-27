/** Containers e ritmo de layout — larguras estáveis, sem posicionamento absoluto em tipografia. */

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

export const container = {
  base: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
  sm: 'max-w-lg',
  md: 'md:max-w-2xl',
  lg: 'xl:max-w-3xl',
  xl: '2xl:max-w-[52rem]',
  flow: 'max-w-3xl',
  prose: 'max-w-[45rem]',
}

export const section = {
  base: 'flex w-full flex-col',
  gapSm: 'gap-2',
  gapMd: 'gap-4',
  gapLg: 'gap-6',
  paddingBottom: 'pb-12 md:pb-14',
}

/**
 * Marcador (sem estilo) usado pelo shell do fluxo para medir o hero visível e
 * dimensionar a faixa escura. Fica na constante compartilhada de propósito: assim todo
 * bloco de hero — os que usam a classe crua e os que passam por
 * <CenteredContent variant="hero|heroBlock"> — é rastreado sem marcação manual.
 */
export const FLOW_HERO_MARKER = 'js-flow-hero'

/**
 * Marcador do container de conteúdo do fluxo. A faixa escura precisa acomodar a
 * distância entre o TOPO do conteúdo e o fim do último bloco marcado — não a altura
 * do bloco isolada. Sem essa referência, um card renderizado ANTES do hero (ex.:
 * "Local informado") não entrava na conta e o título saía cortado ao meio na emenda.
 */
export const FLOW_MAIN_MARKER = 'js-flow-main'

export const centeredContent = {
  base: join(
    'mx-auto flex w-full min-w-0 flex-col items-center text-center',
  ),
  hero: join(
    FLOW_HERO_MARKER,
    'mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-3.5 px-0 text-center sm:max-w-3xl sm:gap-4',
  ),
  heroBlock: join(
    FLOW_HERO_MARKER,
    'mx-auto mb-3 flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 px-0 text-center sm:max-w-3xl sm:mb-4 md:mb-5',
  ),
  /**
   * Mesmo bloco, SEM o marcador: para o passo cujo hero é desenhado para fundo claro
   * (`surface="light"`), porque ele fica ABAIXO da emenda. Marcá-lo faria a faixa
   * escura tentar acomodá-lo e passar por cima do conteúdo seguinte.
   */
  heroBlockOnLight: join(
    'mx-auto mb-3 flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 px-0 text-center sm:max-w-3xl sm:mb-4 md:mb-5',
  ),
}

/**
 * Faixa degradê + overlap, dirigidos por `--flow-hero-space`.
 *
 * A área escura tem altura própria e o conteúdo a sobrepõe por margem negativa, então
 * o espaço escuro útil é exatamente `--flow-hero-space`. Enquanto esse valor era fixo
 * por breakpoint, qualquer hero mais alto vazava para o fundo branco com texto claro
 * (ilegível) — e cada tela quebrava numa largura diferente, porque a altura do hero
 * varia com `clamp()` e com quantos blocos de texto o passo tem (a tela de entrada,
 * por exemplo, tem três).
 *
 * globals.css define um PISO usado só até a primeira medição (evita flicker no 1º
 * paint) e o shell publica em runtime a altura real necessária (`useFlowHeroSpace`).
 * O piso NÃO é um mínimo permanente: quando ele era maior que o conteúdo escuro, a
 * faixa crescia além dele e engolia o que vinha depois — foi assim que o rótulo
 * "Referência de localização" ficava escuro sobre escuro na emenda.
 *
 * Os +12px são o respiro sob o header.
 */
export const flowHeroShell = {
  band: 'h-[calc(var(--flow-hero-space)+12px)] shrink-0',
  overlap: 'mt-[calc(var(--flow-hero-space)*-1)]',
  /** Escopo onde a variável vive — precisa envolver band e overlap. */
  scope: 'flow-hero-scope',
} as const

export const flowMainOverlap = flowHeroShell.overlap

export function composeContainer(size: 'flow' | 'page' | 'full' = 'flow') {
  if (size === 'page') {
    return join(container.base, container.sm, container.md, container.lg, container.xl)
  }
  if (size === 'full') {
    return join(container.base, 'max-w-7xl')
  }
  return join(container.base, container.flow)
}
