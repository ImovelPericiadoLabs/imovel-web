import { cn } from '@/utils/tailwind'
import { PropsWithChildren } from 'react'

type Props = {
  isOpen: boolean
  onClose?: () => void
} & PropsWithChildren
export default function BottomSheet({ isOpen, onClose, children }: Props) {
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
          'fixed bottom-0 left-0 right-0 bg-white shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.3)] rounded-t-[1.75rem] z-50 transition-all duration-500 ease-out',
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
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
