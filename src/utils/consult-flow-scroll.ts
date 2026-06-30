export function scrollConsultFlowToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export function unlockPageScroll() {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const body = document.body

  html.style.overflow = ''
  html.style.height = ''
  body.style.overflow = ''
  body.style.height = ''
  body.style.position = ''
}