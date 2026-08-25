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
 * Agora globals.css define um PISO responsivo e o shell eleva a variável em runtime
 * conforme o hero realmente medido (`useFlowHeroSpace`). Serve qualquer conteúdo, em
 * qualquer idioma/zoom, sem ajuste por tela. Os +12px são o respiro sob o header.
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
