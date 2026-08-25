'use client'

import { useLayoutEffect, useRef } from 'react'

import { FLOW_HERO_MARKER } from '@/styles/layout'

/** Respiro entre o fim do hero e o fim da faixa escura. */
const BREATHING_PX = 8

/**
 * Mede o hero VISÍVEL do passo atual e publica a altura necessária em
 * `--flow-hero-measured`, no elemento de escopo. O CSS combina com um piso responsivo
 * (`max()` em globals.css), então a faixa escura nunca fica menor que o hero — o que
 * antes fazia o texto vazar para o fundo branco e sumir.
 *
 * Mede o visível porque o fluxo mantém os passos montados (<Activity>): os inativos
 * ficam com altura 0 e são naturalmente ignorados pelo max().
 *
 * `useLayoutEffect` roda antes do paint, então a correção não pisca.
 */
export function useFlowHeroSpace<T extends HTMLElement>() {
  const scopeRef = useRef<T>(null)

  useLayoutEffect(() => {
    const scope = scopeRef.current
    if (!scope) return undefined

    const apply = () => {
      const heroes = Array.from(
        document.querySelectorAll<HTMLElement>(`.${FLOW_HERO_MARKER}`),
      )
      // offsetParent null = escondido (passo inativo). getBoundingClientRect ignora
      // margens, que é o que queremos: o respiro é adicionado explicitamente.
      const tallest = heroes.reduce((max, el) => {
        if (el.offsetParent === null) return max
        return Math.max(max, el.getBoundingClientRect().height)
      }, 0)

      if (tallest <= 0) {
        scope.style.removeProperty('--flow-hero-measured')
        return
      }
      scope.style.setProperty('--flow-hero-measured', `${Math.ceil(tallest) + BREATHING_PX}px`)
    }

    apply()

    // ResizeObserver cobre reflow de texto (resize, zoom, fonte carregando);
    // MutationObserver cobre a troca de passo, que monta/desmonta heros.
    const resizeObserver = new ResizeObserver(apply)
    document
      .querySelectorAll<HTMLElement>(`.${FLOW_HERO_MARKER}`)
      .forEach((el) => resizeObserver.observe(el))

    const mutationObserver = new MutationObserver(() => {
      resizeObserver.disconnect()
      document
        .querySelectorAll<HTMLElement>(`.${FLOW_HERO_MARKER}`)
        .forEach((el) => resizeObserver.observe(el))
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
