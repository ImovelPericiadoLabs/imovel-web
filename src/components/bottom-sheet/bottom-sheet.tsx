import { cn } from '@/utils/tailwind'
import { PropsWithChildren } from 'react'

type Props = {
  isOpen: boolean
  onClose?: () => void
  variant?: 'default' | 'alert'
  className?: string
} & PropsWithChildren
export default function BottomSheet({ isOpen, onClose, children, variant = 'default', className }: Props) {
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
        data-testid="bottom-sheet"
        className={cn(
          'fixed bottom-0 left-0 right-0 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-1/2 lg:max-w-[50%] bg-white shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)] rounded-t-xl z-50 transition-all duration-500 ease-out',
          variant === 'alert' && 'border-t-4 border-yellow-400',
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
          className
        )}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-8 h-1 rounded-full bg-handle" />
        </div>

        {children}
      </div>
    </>
  )
}
