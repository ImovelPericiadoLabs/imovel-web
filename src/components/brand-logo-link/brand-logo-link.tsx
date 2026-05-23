'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BRAND_LOGO_WITH_TEXT_SRC } from '@/constants/brand-logo'
import { cn } from '@/utils/tailwind'

type BrandLogoLinkProps = {
  href?: string
  className?: string
  priority?: boolean
  /** `on-primary`: header roxo/VSL (logo branca). `on-light`: fundo claro (logo escura). */
  tone?: 'on-primary' | 'on-light'
}

const toneImgClass: Record<NonNullable<BrandLogoLinkProps['tone']>, string> = {
  'on-primary': '[&_img]:brightness-0 [&_img]:invert',
  'on-light': '[&_img]:brightness-0',
}

export function BrandLogoLink({
  href = '/consultas',
  className,
  priority = false,
  tone = 'on-primary',
}: BrandLogoLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-[8.75rem] max-w-[min(100%,11.5rem)] shrink-0 touch-manipulation sm:w-[9.5rem] md:w-[10.5rem]',
        toneImgClass[tone],
        className,
      )}
      aria-label="Ir para minhas consultas"
    >
      <Image
        src={BRAND_LOGO_WITH_TEXT_SRC}
        alt="Imóvel Periciado"
        width={220}
        height={52}
        priority={priority}
        className="h-9 w-full object-contain object-center sm:h-10 md:h-11"
      />
    </Link>
  )
}
