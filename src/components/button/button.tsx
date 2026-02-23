import Link, { LinkProps } from 'next/link'
import { Children } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LogIn,
  Mail,
  Plus,
  RotateCw,
  Save,
  Search,
  Send,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  Partial<LinkProps> & {
    href?: string
    className?: string
    variant?: 'primary' | 'outline'
    icon?: React.ReactNode
  }

function getAutoIcon(content: React.ReactNode) {
  const items = Children.toArray(content)
  if (items.length !== 1 || typeof items[0] !== 'string') return null

  const label = items[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (label.includes('voltar')) return <ArrowLeft className="size-5" />
  if (label.includes('continuar') || label.includes('avancar') || label.includes('prosseguir') || label.includes('comecar')) {
    return <ArrowRight className="size-5" />
  }
  if (label.includes('confirmar') || label.includes('verificar') || label.includes('finalizar') || label.includes('concluir')) {
    return <CheckCircle2 className="size-5" />
  }
  if (label.includes('pagar') || label.includes('pagamento')) return <CreditCard className="size-5" />
  if (label.includes('consultar') || label.includes('consultas') || label.includes('buscar')) return <Search className="size-5" />
  if (label.includes('entrar') || label.includes('acessar') || label.includes('login')) return <LogIn className="size-5" />
  if (label.includes('enviar')) return <Send className="size-5" />
  if (label.includes('reenviar')) return <RotateCw className="size-5" />
  if (label.includes('salvar')) return <Save className="size-5" />
  if (label.includes('adicionar') || label.includes('novo') || label.includes('criar') || label.includes('cadastrar')) {
    return <Plus className="size-5" />
  }
  if (label.includes('email') || label.includes('e-mail')) return <Mail className="size-5" />

  return null
}

export default function Button({ children, className, href, variant = 'primary', icon, type, ...rest }: ButtonProps) {
  
  const variants = {
    primary: 'bg-[var(--color-button-primary)] hover:bg-[var(--color-button-primary-hover)] text-white',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/5'
  }

  const resolvedIcon = icon ?? getAutoIcon(children)

  const baseClasses = cn(
    `
      cursor-pointer w-full 
      text-base leading-6 font-semibold px-11 py-3 rounded-xl 
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-gray-300 disabled:shadow-none
      flex items-center justify-center text-center decoration-0
      !shadow-[0_6px_0_rgba(11,27,58,0.8)] active:translate-y-1 active:!shadow-[0_2px_0_rgba(11,27,58,0.8)]
      touch-manipulation
    `,
    variants[variant],
    className
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={baseClasses}
        {...(rest as Omit<LinkProps, 'href'>)} 
      >
        {resolvedIcon && <span className="mr-2 flex items-center">{resolvedIcon}</span>}
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type ?? 'button'}
      className={baseClasses}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {resolvedIcon && <span className="mr-2 flex items-center">{resolvedIcon}</span>}
      {children}
    </button>
  )
}