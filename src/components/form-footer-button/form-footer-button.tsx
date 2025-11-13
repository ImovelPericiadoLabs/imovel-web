import React from 'react'
import Button from '@/components/button'
import { cn } from '@/utils/tailwind'

type Props = {
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Um botão de rodapé para formulários que é fixo na base em
 * viewports mobile e estático (em fluxo) em viewports maiores.
 * Este componente envolve o seu <Button> base.
 */
export default function FormFooterButton({
  children,
  className,
  ...rest
}: Props) {
  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-10 px-4 py-4
        md:static md:mt-6 md:p-0
      "
      data-testid="footer-container"
    >
      <Button
        className={cn(
          'h-13 md:w-auto md:px-10',
          className,
        )}
        {...rest}
      >
        {children}
      </Button>
    </div>
  )
}