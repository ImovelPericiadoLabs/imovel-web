import { clearStalePageScrollLock } from '@/utils/page-scroll-lock'

export function scrollConsultFlowToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export function unlockPageScroll() {
  clearStalePageScrollLock()
}