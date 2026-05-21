import { cn } from '@/utils/tailwind'
import { PropsWithChildren, useEffect, useRef } from 'react'

type Props = {
  isOpen: boolean
  onClose?: () => void
  variant?: 'default' | 'alert'
  className?: string
} & PropsWithChildren

export default function BottomSheet({ isOpen, onClose, children, variant = 'default', className }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Focus trap: garante que foco fica dentro do modal enquanto aberto
  // Isolamento total - sem dependência de lógica em componentes filhas
  useEffect(() => {
    if (!isOpen) return

    // Salvar elemento com foco anterior para restauração quando modal fecha
    previousFocusRef.current = document.activeElement as HTMLElement

    // Handler para Tab: limita foco dentro do modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!modalRef.current) return

      // Obter todos os elementos focusáveis dentro do modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      const activeElement = document.activeElement

      // Se Shift+Tab no primeiro elemento: mover para último
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
        return
      }

      // Se Tab no último elemento: mover para primeiro
      if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    // Handler para Escape: fechar modal
    const handleKeyDown_Escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    // Focar no primeiro elemento focusável imediatamente quando modal abre
    const focusableElements = modalRef.current?.querySelectorAll(
      'input, button:not(.handle), select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements && focusableElements.length > 0) {
      ;(focusableElements[0] as HTMLElement).focus()
    }

    // Listeners para controlar foco dentro do modal
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleKeyDown_Escape)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleKeyDown_Escape)

      // Restaurar foco anterior quando modal fecha
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  // Isolamento: quando modal está aberto, marcar resto da página como inert
  useEffect(() => {
    if (!isOpen) return

    const htmlElement = document.documentElement
    htmlElement.style.overflow = 'hidden'

    // Marcar elementos fora do modal como inert (não-interativos)
    const allElements = document.querySelectorAll('body > *')
    const previousInertStates = new Map<Element, boolean>()

    allElements.forEach((el) => {
      if (el !== modalRef.current?.parentElement && !el.classList.contains('fixed')) {
        previousInertStates.set(el, el.hasAttribute('inert'))
        el.setAttribute('inert', '')
      }
    })

    return () => {
      htmlElement.style.overflow = ''
      previousInertStates.forEach((wasInert, el) => {
        if (!wasInert) {
          el.removeAttribute('inert')
        }
      })
    }
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          data-testid="overlay"
          className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-500"
          onClick={onClose}
        />
      )}
      <div
        ref={modalRef}
        data-testid="bottom-sheet"
        role="dialog"
        aria-modal={isOpen}
        className={cn(
          'fixed bottom-0 left-0 right-0 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-1/2 lg:max-w-[50%] bg-white shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)] rounded-t-xl z-50 transition-all duration-500 ease-out',
          variant === 'alert' && 'border-t-4 border-yellow-400',
          className
        )}
        aria-hidden={!isOpen}
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-8 h-1 rounded-full bg-handle" />
        </div>

        {children}
      </div>
    </>
  )
}
