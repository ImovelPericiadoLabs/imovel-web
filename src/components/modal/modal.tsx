'use client'

import { useState, useEffect, cloneElement, isValidElement, ReactNode, ReactElement } from 'react'
import ReactDOM from 'react-dom'
import { X, ChevronLeft } from 'lucide-react'

interface ModalProps {
  children?: ReactNode
  content: ReactNode
  title?: string
  open?: boolean
  onClose?: () => void
  onBack?: () => void
}

export default function Modal({ children, content, title, open, onClose }: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = typeof open === 'boolean'
  const isOpen = isControlled ? open : internalOpen

  const modalRoot = typeof document !== 'undefined' ? document.body : null

  interface TriggerElementProps {
    onClick?: (e: React.MouseEvent<HTMLElement>) => void
  }

  const trigger =
    children && isValidElement(children)
      ? cloneElement(children as ReactElement<TriggerElementProps>, {
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault()
            e.stopPropagation()

            if (!isControlled) {
              setInternalOpen(true)
            }
          },
        })
      : children

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    if (isControlled) onClose?.()
    else setInternalOpen(false)
  }

  if (!isOpen) return trigger

  if (!modalRoot) return trigger

  return (
    <>
      {trigger}

      {ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-50 flex justify-center items-start"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          <div className="relative bg-white w-full h-full shadow-lg animate-slide-up flex flex-col overflow-hidden">
            <div className="flex flex-row items-center gap-1 mb-0 px-4 py-5 bg-primary text-white">
              <button onClick={handleClose} className="cursor-pointer">
                <ChevronLeft className="size-7" />
              </button>

              <h2 className="text-sm font-semibold">{title}</h2>

              <button onClick={handleClose} className="ml-auto cursor-pointer">
                <X className="size-7" />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-hide">{content}</div>
          </div>
        </div>,
        modalRoot,
      )}
    </>
  )
}
