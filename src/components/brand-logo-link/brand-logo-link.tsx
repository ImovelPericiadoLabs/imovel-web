'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BRAND_LOGO_DARK_SRC,
  BRAND_LOGO_HEIGHT,
  BRAND_LOGO_LIGHT_SRC,
  BRAND_LOGO_WIDTH,
} from '@/constants/brand-logo'
import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import { cn } from '@/utils/tailwind'

type BrandLogoLinkProps = {
  /** Se omitido: logado → /consultas; visitante → início do fluxo de consulta. */
  href?: string
  className?: string
  priority?: boolean
  /** `on-primary`: header azul/VSL. `on-light`: fundo claro. */
  tone?: 'on-primary' | 'on-light'
}

const logoImgClass =
  'block h-12 w-full object-contain object-center sm:h-[3.5rem] md:h-14 [image-rendering:auto] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]'

export function BrandLogoLink({
  href,
  className,
  priority = false,
  tone = 'on-primary',
}: BrandLogoLinkProps) {
  const { status } = useSession()

  const resolvedHref =
    href ?? (status === 'authenticated' ? '/consultas' : CONSULTAR_IMOVEL_INICIO_HREF)

  const src = tone === 'on-light' ? BRAND_LOGO_DARK_SRC : BRAND_LOGO_LIGHT_SRC
  const ariaLabel =
    resolvedHref === '/consultas' ? 'Ir para minhas consultas' : 'Ir para como quer começar'

  return (
    <Link
      href={resolvedHref}
      className={cn(
        'inline-flex w-[9rem] max-w-[min(100%,12rem)] shrink-0 touch-manipulation sm:w-[9.75rem] md:w-[10.75rem]',
        className,
      )}
      aria-label={ariaLabel}
    >
      <Image
        src={src}
        alt="Imóvel Periciado"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        priority={priority}
        unoptimized
        sizes="(max-width: 640px) 144px, (max-width: 768px) 156px, 172px"
        draggable={false}
        className={logoImgClass}
      />
    </Link>
  )
}
