import { beforeEach, describe, expect, it } from 'vitest'
import { clearStalePageScrollLock, lockPageScroll } from './page-scroll-lock'

describe('page scroll lock', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    document.body.style.cssText = ''
    clearStalePageScrollLock()
  })

  it('mantém o scroll bloqueado até o último overlay fechar', () => {
    const releaseFirst = lockPageScroll()
    const releaseSecond = lockPageScroll()

    releaseFirst()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')

    releaseSecond()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('restaura os estilos anteriores e aceita cleanup repetido', () => {
    document.documentElement.style.overflow = 'clip'
    document.body.style.overflow = 'scroll'

    const release = lockPageScroll()
    release()
    release()

    expect(document.documentElement.style.overflow).toBe('clip')
    expect(document.body.style.overflow).toBe('scroll')
  })
})
