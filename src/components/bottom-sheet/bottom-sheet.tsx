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

  // Isolamento de árvore focável: remover do tab order elementos fora do modal
  // Isso resolve focus leakage sem loops de side effects
  useEffect(() => {
    if (!isOpen) return

    const allFocusableElements = document.querySelectorAll(
      'input, button, select, textarea, a[href], [tabindex]'
    )

    const elementsToRestore: HTMLElement[] = []

    // Remover elementos fora do modal do tab order
    allFocusableElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (!modalRef.current?.contains(el)) {
        const originalTabindex = htmlEl.getAttribute('tabindex')
        htmlEl.setAttribute('tabindex', '-1')
        elementsToRestore.push(htmlEl)
      }
    })

    return () => {
      // Restaurar tabindex original
      elementsToRestore.forEach((el) => {
        el.removeAttribute('tabindex')
      })
    }
  }, [isOpen])

  // Focus trap: garante que foco fica dentro do modal enquanto aberto
  useEffect(() => {
    if (!isOpen) return

    // Salvar elemento com foco anterior para restauração quando modal fecha
    previousFocusRef.current = document.activeElement as HTMLElement

    // Handler para Escape: fechar modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }

    // Listeners para controlar foco dentro do modal
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restaurar foco anterior quando modal fecha
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      return
    }

    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          data-testid="overlay"
          className="fixed inset-0 z-40"
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto',
          }}
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
