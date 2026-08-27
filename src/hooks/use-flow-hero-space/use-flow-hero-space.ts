'use client'

import { useLayoutEffect, useRef } from 'react'

import { FLOW_HERO_MARKER, FLOW_MAIN_MARKER } from '@/styles/layout'

/** Respiro entre o fim do hero e o fim da faixa escura. */
const BREATHING_PX = 8

/**
 * Publica em `--flow-hero-measured` quanto de faixa escura o passo atual precisa.
 *
 * A medida é a distância do TOPO do conteúdo até o fim do último bloco marcado com
 * `FLOW_HERO_MARKER` — não a altura do bloco. A diferença importa quando algo é
 * renderizado ANTES dele: nos passos com o card "Local informado", medir só a altura
 * do hero deixava a faixa curta e o título saía cortado ao meio na emenda.
 *
 * Marcar um bloco significa "isto precisa caber no escuro". Hero desenhado para fundo
 * claro (`surface="light"`) não leva o marcador — ele fica abaixo da emenda.
 *
 * Mede o visível porque o fluxo mantém os passos montados (<Activity>): os inativos
 * ficam com offsetParent null e são ignorados.
 *
 * `useLayoutEffect` roda antes do paint, então a correção não pisca.
 */
export function useFlowHeroSpace<T extends HTMLElement>() {
  const scopeRef = useRef<T>(null)

  useLayoutEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined

    const apply = () => {
      const main = scope.querySelector<HTMLElement>(`.${FLOW_MAIN_MARKER}`)
      if (!main) return

      // `main` é puxado para cima pela própria variável, mas a distância INTERNA entre
      // o topo dele e o fim do bloco marcado não depende de onde ele está — então não
      // há realimentação entre medir e aplicar.
      const mainTop = main.getBoundingClientRect().top
      const marked = Array.from(
        document.querySelectorAll<HTMLElement>(`.${FLOW_HERO_MARKER}`),
      )
      // offsetParent null = escondido (passo inativo). getBoundingClientRect ignora
      // margens, que é o que queremos: o respiro é adicionado explicitamente.
      const deepest = marked.reduce((max, el) => {
        if (el.offsetParent === null) return max
        return Math.max(max, el.getBoundingClientRect().bottom - mainTop)
      }, 0)

      if (deepest <= 0) {
        scope.style.removeProperty('--flow-hero-measured')
        return
      }
      scope.style.setProperty('--flow-hero-measured', `${Math.ceil(deepest) + BREATHING_PX}px`)
    }

    apply()

    // ResizeObserver cobre reflow de texto (resize, zoom, fonte carregando);
    // MutationObserver cobre a troca de passo, que monta/desmonta heros.
    const observeTargets = (observer: ResizeObserver) => {
      document
        .querySelectorAll<HTMLElement>(`.${FLOW_HERO_MARKER}`)
        .forEach((el) => observer.observe(el))
      // O main também: o que muda a medida é o conteúdo ANTES do bloco marcado.
      const main = scope.querySelector<HTMLElement>(`.${FLOW_MAIN_MARKER}`)
      if (main) observer.observe(main)
    }

    const resizeObserver = new ResizeObserver(apply)
    observeTargets(resizeObserver)

    const mutationObserver = new MutationObserver(() => {
      resizeObserver.disconnect()
      observeTargets(resizeObserver)
      apply()
    })
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class'],
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return scopeRef
}
