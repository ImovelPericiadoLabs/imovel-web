import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function WalletBalanceIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden {...props}>
      <rect width="40" height="40" rx="12" fill="#ECFDF5" />
      <rect x="8" y="13" width="24" height="16" rx="4" fill="#10B981" />
      <path d="M8 17.5h24" stroke="#059669" strokeWidth="2" />
      <circle cx="27" cy="23" r="2.4" fill="#A7F3D0" />
      <path d="M12 13V11.5A3.5 3.5 0 0 1 15.5 8h9A3.5 3.5 0 0 1 28 11.5V13" stroke="#059669" strokeWidth="1.8" />
    </svg>
  )
}

export function PixMethodIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden {...props}>
      <rect width="40" height="40" rx="12" fill="#E6F7F3" />
      <path
        fill="#32BCAD"
        d="M20 9.2c.7 0 1.36.27 1.85.76l3.2 3.2a5.4 5.4 0 0 0-1.5.2l-3.3-3.3a.5.5 0 0 0-.7 0l-3.3 3.3a5.4 5.4 0 0 0-1.5-.2l3.2-3.2c.5-.49 1.16-.76 1.85-.76Zm7.9 5.05c.7 0 1.35.27 1.84.76l2.3 2.3c1.02 1.02 1.02 2.67 0 3.69l-2.3 2.3a2.6 2.6 0 0 1-1.84.76h-1.1l-3.3-3.3.16-.14c.4-.3.74-.7.98-1.16.24.46.58.86.98 1.16l.16.14 3.3-3.3h1.1Zm-15.8 0h1.1l3.3 3.3-.16.14a3.7 3.7 0 0 0-.98 1.16 3.7 3.7 0 0 0 .98 1.16l.16.14-3.3 3.3h-1.1a2.6 2.6 0 0 1-1.84-.76l-2.3-2.3a2.61 2.61 0 0 1 0-3.69l2.3-2.3a2.6 2.6 0 0 1 1.84-.76ZM20 17.4c.7 0 1.28.3 1.7.72.2.2.36.43.48.68a2.6 2.6 0 0 0-.48.68c-.42.42-1 .72-1.7.72s-1.28-.3-1.7-.72a2.6 2.6 0 0 0-.48-.68c.12-.25.28-.48.48-.68.42-.42 1-.72 1.7-.72Zm-1.85 5.1 3.3 3.3a.5.5 0 0 0 .7 0l3.3-3.3c.5.08 1 .15 1.5.2l-3.2 3.2a2.61 2.61 0 0 1-3.7 0l-3.2-3.2c.5-.05 1-.12 1.5-.2Z"
      />
    </svg>
  )
}

export function CreditCardMethodIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden {...props}>
      <rect width="40" height="40" rx="12" fill="#EEF4FF" />
      <rect x="7.5" y="12" width="25" height="16.5" rx="3.5" fill="#2563EB" />
      <rect x="7.5" y="16.2" width="25" height="4" fill="#1D4ED8" />
      <rect x="11" y="22.6" width="8" height="2.2" rx="1" fill="#BFDBFE" />
      <circle cx="26.2" cy="23.8" r="2.1" fill="#FBBF24" />
      <circle cx="28.6" cy="23.8" r="2.1" fill="#F87171" fillOpacity=".85" />
    </svg>
  )
}

export function DebitCardMethodIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden {...props}>
      <rect width="40" height="40" rx="12" fill="#F3EEFF" />
      <rect x="7.5" y="12" width="25" height="16.5" rx="3.5" fill="#7C3AED" />
      <rect x="7.5" y="16.2" width="25" height="4" fill="#6D28D9" />
      <rect x="11" y="22.6" width="10" height="2.2" rx="1" fill="#DDD6FE" />
      <path d="M25.2 21.8 28.6 24l-3.4 2.2v-1.35h-3.1v-1.7h3.1V21.8Z" fill="#EDE9FE" />
    </svg>
  )
}

export function BoletoMethodIcon({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden {...props}>
      <rect width="40" height="40" rx="12" fill="#FFF7ED" />
      <rect x="9" y="10.5" width="22" height="19" rx="3" fill="#F59E0B" />
      <path
        d="M12.2 14h1.1v12h-1.1V14Zm2.2 0h.7v12h-.7V14Zm1.5 0h1.4v12h-1.4V14Zm2.2 0h.55v12h-.55V14Zm1.2 0h1.6v12h-1.6V14Zm2.3 0h.7v12h-.7V14Zm1.4 0h1.1v12h-1.1V14Zm1.8 0h.55v12h-.55V14Zm1.15 0h1.5v12h-1.5V14Z"
        fill="#FFFBEB"
      />
    </svg>
  )
}
