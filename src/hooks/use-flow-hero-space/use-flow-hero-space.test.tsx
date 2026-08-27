/**
 * A faixa escura precisa acomodar do TOPO do conteúdo até o fim do último bloco
 * marcado — não a altura do bloco isolada.
 *
 * Medir só a altura deixava a faixa curta quando algo era renderizado ANTES do bloco
 * (o card "Local informado") e o título saía cortado ao meio na emenda; e fazia a
 * faixa sobrar quando o piso do CSS era maior, engolindo o conteúdo seguinte.
 */
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFlowHeroSpace } from './use-flow-hero-space'
import { FLOW_HERO_MARKER, FLOW_MAIN_MARKER } from '@/styles/layout'

const realRect = Element.prototype.getBoundingClientRect
const realOffsetParent = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')

beforeEach(() => {
  // jsdom não faz layout nem expõe offsetParent: encenamos ambos por atributo,
  // ANTES do render, para o useLayoutEffect do hook já medir os valores certos.
  Element.prototype.getBoundingClientRect = function () {
    const top = Number((this as HTMLElement).dataset?.top ?? 0)
    const height = Number((this as HTMLElement).dataset?.height ?? 0)
    return { top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect
  }
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return (this as HTMLElement).dataset?.hidden === 'true' ? null : document.body
    },
  })
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect
  if (realOffsetParent) Object.defineProperty(HTMLElement.prototype, 'offsetParent', realOffsetParent)
  vi.unstubAllGlobals()
})

function Harness({ children }: { children: React.ReactNode }) {
  const ref = useFlowHeroSpace<HTMLElement>()
  return <section ref={ref} data-testid="scope">{children}</section>
}

const measured = (el: HTMLElement) => el.style.getPropertyValue('--flow-hero-measured')

describe('useFlowHeroSpace', () => {
  it('mede do topo do conteúdo até o fim do bloco marcado', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="100" data-height="300">
          <div data-top="100" data-height="80" />
          <div className={FLOW_HERO_MARKER} data-top="180" data-height="60" />
        </div>
      </Harness>,
    )
    // hero.bottom(240) - main.top(100) = 140, + 8 de respiro.
    expect(measured(getByTestId('scope'))).toBe('148px')
  })

  it('não usa a altura do bloco — é isso que cortava o título ao meio', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="100" data-height="300">
          <div data-top="100" data-height="80" />
          <div className={FLOW_HERO_MARKER} data-top="180" data-height="60" />
        </div>
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).not.toBe('68px')
  })

  it('bloco no topo do conteúdo mede a própria altura', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="100" data-height="300">
          <div className={FLOW_HERO_MARKER} data-top="100" data-height="90" />
        </div>
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).toBe('98px')
  })

  it('usa o bloco mais profundo quando há mais de um visível', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="0" data-height="300">
          <div className={FLOW_HERO_MARKER} data-top="0" data-height="40" />
          <div className={FLOW_HERO_MARKER} data-top="40" data-height="70" />
        </div>
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).toBe('118px')
  })

  it('ignora passo inativo (offsetParent nulo)', () => {
    /** O fluxo mantém os passos montados; só o visível pode dimensionar a faixa. */
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="0" data-height="300">
          <div className={FLOW_HERO_MARKER} data-top="0" data-height="50" />
          <div className={FLOW_HERO_MARKER} data-top="0" data-height="400" data-hidden="true" />
        </div>
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).toBe('58px')
  })

  it('sem bloco marcado não publica nada — o piso do CSS assume', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_MAIN_MARKER} data-top="100" data-height="300">
          <p>sem marcador</p>
        </div>
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).toBe('')
  })

  it('sem o container de conteúdo, não publica valor errado', () => {
    const { getByTestId } = render(
      <Harness>
        <div className={FLOW_HERO_MARKER} data-top="180" data-height="60" />
      </Harness>,
    )
    expect(measured(getByTestId('scope'))).toBe('')
  })
})
