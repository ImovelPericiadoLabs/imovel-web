'use client'
import { PropsWithChildren, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Menu } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/whatsapp-icon/whatsapp-icon'
import HeaderTitle from '@/components/header-title'
import useIsRouteMatch from '@/hooks/use-is-router-match'
import { Providers } from '@/providers/'

export default function AppLayout({ children }: PropsWithChildren) {
  const { push, back } = useRouter()
  const { isMatch, pathname } = useIsRouteMatch()

  function handleGoBack() {
    const mapRoutes: Record<string, string> = {
      '/consultas': '/consultar-imovel',
    }
    if (mapRoutes[pathname]) {
      push(mapRoutes[pathname])
    } else {
      back()
    }
  }

  const headerTitle = useMemo(() => {
    if (isMatch('/consultas/:id')) {
      return <HeaderTitle>Resultado da consulta</HeaderTitle>
    }

    if (isMatch('/consultas/:id/opcoes')) {
      return <HeaderTitle>Resultado da consulta</HeaderTitle>
    }

    if (isMatch('/consultas/:id/opcoes/resultado')) {
      return <HeaderTitle>Resultado completo</HeaderTitle>
    }

    if (isMatch('/consultas/:id/opcoes/documentos')) {
      return <HeaderTitle>Documentos</HeaderTitle>
    }

    if (isMatch('/consultas/:id/opcoes/proprietarios')) {
      return <HeaderTitle>Proprietários</HeaderTitle>
    }

    return <></>
  }, [isMatch])

  return (
    <Providers>
    <section className="min-h-screen bg-white pb-6">
      <header className="flex flex-col pt-4 px-4 bg-primary relative z-40">
        <div className="flex items-center justify-between py-4.5 mb-6">
          <div className="flex items-center justify-center gap-3.5">
            <ChevronLeft
              onClick={handleGoBack}
              className={'size-7 text-white cursor-pointer'}
              role="button"
            />
            {headerTitle}
          </div>

          {pathname === '/consultas' && (
            <div className="relative">
              <Image
                src="/images/logo.svg"
                alt="Logo"
                width={72}
                height={70}
                className="object-contain -my-2.5"
              />
            </div>
          )}

          <div className="flex gap-2">
            <WhatsAppIcon className="cursor-pointer size-7 text-white" />
            {pathname === '/consultas' && <Menu className="cursor-pointer size-7 text-white" />}
          </div>
        </div>
      </header>
      {children}
    </section>
    </Providers>
  )
}
