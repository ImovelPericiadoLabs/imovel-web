type ScrollStyles = {
  htmlOverflow: string
  bodyOverflow: string
}

const activeLocks = new Set<symbol>()
let previousStyles: ScrollStyles | null = null

export function lockPageScroll(): () => void {
  if (typeof document === 'undefined') return () => undefined

  const token = Symbol('page-scroll-lock')

  if (activeLocks.size === 0) {
    previousStyles = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }

  activeLocks.add(token)
  let released = false

  return () => {
    if (released) return
    released = true
    activeLocks.delete(token)

    if (activeLocks.size > 0) return

    document.documentElement.style.overflow = previousStyles?.htmlOverflow ?? ''
    document.body.style.overflow = previousStyles?.bodyOverflow ?? ''
    previousStyles = null
  }
}

export function clearStalePageScrollLock() {
  if (typeof document === 'undefined' || activeLocks.size > 0) return

  document.documentElement.style.overflow = ''
  document.documentElement.style.height = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
  document.body.style.position = ''
}
