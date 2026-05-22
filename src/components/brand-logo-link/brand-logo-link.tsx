'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/utils/tailwind'

type BrandLogoLinkProps = {
  href?: string
  className?: string
  priority?: boolean
}

export function BrandLogoLink({
  href = '/consultas',
  className,
  priority = false,
}: BrandLogoLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex max-w-[11.5rem] shrink-0 touch-manipulation sm:max-w-[12.5rem] md:max-w-[13.5rem]',
        className,
      )}
      aria-label="Ir para minhas consultas"
    >
      <Image
        src="/images/logo_text.svg"
        alt="Imóvel Periciado"
        width={220}
        height={40}
        priority={priority}
        className="h-9 w-auto max-h-10 object-contain object-left sm:h-10"
      />
    </Link>
  )
}
