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

export const centeredContent = {
  base: join(
    'mx-auto flex w-full min-w-0 flex-col items-center text-center',
  ),
  hero: join(
    'mx-auto flex w-full min-w-0 max-w-2xl flex-col items-center gap-3.5 px-0 text-center sm:max-w-3xl sm:gap-4',
  ),
  heroBlock: join(
    'mx-auto mb-3 flex w-full min-w-0 max-w-2xl flex-col items-center gap-2 px-0 text-center sm:max-w-3xl sm:mb-4 md:mb-5',
  ),
}

/**
 * Faixa degradê + overlap (valores PAREADOS — alterar sempre os dois juntos).
 *
 * `band` estende a área escura para baixo; `overlap` puxa o conteúdo para cima sobre
 * ela. A diferença entre os dois (12px em todo breakpoint) é o respiro abaixo do
 * header, e é o que mantém o bloco do hero na MESMA posição visual: subindo band e
 * overlap no mesmo delta, o conteúdo não se move e só a faixa escura cresce.
 *
 * Os degraus de sm+ existem porque o título/subtítulo crescem por `clamp()` no
 * desktop: medido, o bloco vai de 91px (mobile, cabe) a 113px (lg+), e com os valores
 * antigos a 2ª linha do subtítulo vazava 11–17px para fora do degradê, caindo no fundo
 * branco com cor clara (ilegível). O base (mobile) fica intocado de propósito.
 */
export const flowHeroShell = {
  band: 'h-[6.75rem] shrink-0 sm:h-[7.5rem] md:h-[8rem] lg:h-[8.25rem]',
  overlap: '-mt-[6rem] sm:-mt-[6.75rem] md:-mt-[7.25rem] lg:-mt-[7.5rem]',
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
